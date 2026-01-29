import { useEffect, useRef, useState, useCallback } from "react";

// 소개 섹션 (크고 중앙에)
const INTRO_SECTIONS = ["Hello.", "I'm Somi", "from Seoul.", "I write code."];

// 메뉴 (작고 하단에 가로로)
const MENU_ITEMS = ["About", "Blog", "Contact"];

function getRandomChar(): string {
  // return "·"; // middle dot - 더 섬세한 느낌
  return "-";
}

// 텍스트를 화면 너비에 맞게 줄바꿈
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Canvas를 사용해 텍스트를 픽셀 매트릭스로 변환
// isMenu: true면 하단에 작게, false면 중앙에 크게
function textToMatrix(text: string, cols: number, rows: number, isMenu = false): boolean[][] {
  const canvas = document.createElement("canvas");
  // 더 높은 해상도로 렌더링 후 다운샘플링
  const scale = 4;
  canvas.width = cols * scale;
  canvas.height = rows * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  // 배경 클리어
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 텍스트 그리기
  ctx.fillStyle = "black";

  if (isMenu) {
    // 메뉴: 세로로 중앙 배치, 큰 폰트
    const fontSize = Math.floor(rows * scale * 0.25);
    ctx.font = `900 ${fontSize}px "Montserrat", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const menuItems = text.split("   ·   ");
    const lineHeight = fontSize * 1.1;
    const totalHeight = menuItems.length * lineHeight;
    const startY = (canvas.height - totalHeight) / 2;

    menuItems.forEach((item, index) => {
      ctx.fillText(item, canvas.width / 2, startY + index * lineHeight + lineHeight / 2);
    });
  } else {
    // 소개: 큰 폰트, 중앙 배치
    const fontSize = Math.floor(rows * scale * 0.35);
    ctx.font = `900 ${fontSize}px "Montserrat", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lineHeight = fontSize * 0.85;

    // 가로로 1.3배 늘리기 위해 maxWidth 조정
    const stretchX = 1.3;
    const maxWidth = (canvas.width * 0.8) / stretchX;

    // 텍스트 자동 줄바꿈
    const lines = wrapText(ctx, text, maxWidth);

    // 전체 텍스트 블록의 높이 계산
    const totalTextHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalTextHeight) / 2;

    // 가로로 늘려서 중앙에 그리기
    ctx.save();
    ctx.setTransform(stretchX, 0, 0, 1, 0, 0);

    lines.forEach((line, index) => {
      const centerX = canvas.width / 2 / stretchX;
      ctx.fillText(line, centerX, startY + index * lineHeight + lineHeight / 2);
    });

    ctx.restore();
  }

  // 픽셀 데이터 추출
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const matrix: boolean[][] = [];

  // 다운샘플링하면서 매트릭스 생성
  for (let y = 0; y < rows; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < cols; x++) {
      // scale x scale 영역의 평균값 계산
      let darkPixels = 0;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = x * scale + sx;
          const py = y * scale + sy;
          const idx = (py * canvas.width + px) * 4;
          if (imageData.data[idx] < 128) {
            darkPixels++;
          }
        }
      }
      // 절반 이상이 어두우면 텍스트로 판정
      row.push(darkPixels > (scale * scale) / 3);
    }
    matrix.push(row);
  }

  return matrix;
}

export default function Garden3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState<string[][]>([]);
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [textMatrices, setTextMatrices] = useState<boolean[][][]>([]);
  const animationRef = useRef<number | null>(null);
  const lastNoiseTime = useRef<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 차원 계산 - 젠 정원처럼 여유로운 간격
  const calculateDimensions = useCallback(() => {
    const charWidth = 10; // 중간 간격 (letterSpacing 4px 포함)
    const charHeight = 16; // 중간 줄 간격
    const cols = Math.ceil(window.innerWidth / charWidth);
    const rows = Math.ceil(window.innerHeight / charHeight);
    return { cols, rows };
  }, []);

  // 초기 설정 및 리사이즈 핸들러
  useEffect(() => {
    const updateDimensions = () => {
      const dims = calculateDimensions();
      setDimensions(dims);

      // 소개 섹션 매트릭스 생성 (크게)
      const introMatrices = INTRO_SECTIONS.map((section) => textToMatrix(section, dims.cols, dims.rows, false));
      // 메뉴 매트릭스 생성 (작게, 하단에 가로로)
      const menuText = MENU_ITEMS.join("   ·   ");
      const menuMatrix = textToMatrix(menuText, dims.cols, dims.rows, true);
      // 모든 매트릭스 합치기
      setTextMatrices([...introMatrices, menuMatrix]);

      // 초기 그리드 생성
      const newGrid: string[][] = [];
      for (let y = 0; y < dims.rows; y++) {
        const row: string[] = [];
        for (let x = 0; x < dims.cols; x++) {
          row.push(getRandomChar());
        }
        newGrid.push(row);
      }
      setGrid(newGrid);
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [calculateDimensions]);

  // 스크롤 핸들러
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollHeight = docHeight - winHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setScrollProgress(Math.min(1, Math.max(0, progress)));

      // 스크롤 중 상태 설정
      setIsScrolling(true);

      // 기존 타임아웃 클리어
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // 스크롤 멈추면 150ms 후 isScrolling = false
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    // 초기값 설정
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // 애니메이션 루프
  useEffect(() => {
    if (dimensions.cols === 0 || textMatrices.length === 0) return;

    const animate = (time: number) => {
      // 스크롤 중일 때만 업데이트 (50ms 간격)
      if (isScrolling && time - lastNoiseTime.current > 50) {
        lastNoiseTime.current = time;

        // 현재 섹션 계산 (소개 4개 + 메뉴 1개 = 5개)
        const totalSections = INTRO_SECTIONS.length + 1;
        const sectionIndex = Math.min(Math.floor(scrollProgress * totalSections), totalSections - 1);

        // 섹션 내 진행도 (0-1)
        const rawSectionProgress = (scrollProgress * totalSections) % 1 || (scrollProgress === 1 ? 1 : 0);
        const isMenuSection = sectionIndex === INTRO_SECTIONS.length;

        // 페이드인/페이드아웃 효과
        let textVisibility: number;
        if (isMenuSection) {
          // 메뉴 섹션: 페이드인만, 페이드아웃 없이 유지
          if (rawSectionProgress < 0.2) {
            textVisibility = rawSectionProgress / 0.2;
          } else {
            textVisibility = 1;
          }
        } else {
          // 소개 섹션: 페이드인/페이드아웃
          if (rawSectionProgress < 0.2) {
            textVisibility = rawSectionProgress / 0.2;
          } else if (rawSectionProgress > 0.8) {
            textVisibility = (1 - rawSectionProgress) / 0.2;
          } else {
            textVisibility = 1;
          }
        }

        const currentMatrix = textMatrices[sectionIndex];
        if (!currentMatrix || currentMatrix.length === 0) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        // 글씨까지의 거리 맵 계산 (blur 효과용)
        const distanceMap: number[][] = [];
        const maxBlurDist = Math.floor(15 * (1 - textVisibility) + 1); // visibility 낮을수록 blur 범위 넓음

        for (let y = 0; y < dimensions.rows; y++) {
          distanceMap[y] = [];
          for (let x = 0; x < dimensions.cols; x++) {
            if (currentMatrix[y]?.[x]) {
              distanceMap[y][x] = 0; // 글씨 픽셀
            } else {
              // 주변 글씨 픽셀까지의 최소 거리 계산
              let minDist = Infinity;
              for (let dy = -maxBlurDist; dy <= maxBlurDist; dy++) {
                for (let dx = -maxBlurDist; dx <= maxBlurDist; dx++) {
                  const ny = y + dy;
                  const nx = x + dx;
                  if (ny >= 0 && ny < dimensions.rows && nx >= 0 && nx < dimensions.cols) {
                    if (currentMatrix[ny]?.[nx]) {
                      const dist = Math.sqrt(dx * dx + dy * dy);
                      minDist = Math.min(minDist, dist);
                    }
                  }
                }
              }
              distanceMap[y][x] = minDist;
            }
          }
        }

        const newGrid: string[][] = [];
        for (let y = 0; y < dimensions.rows; y++) {
          const row: string[] = [];
          for (let x = 0; x < dimensions.cols; x++) {
            const isTextPixel = currentMatrix[y]?.[x] || false;
            const dist = distanceMap[y][x];

            if (isTextPixel) {
              // 글씨 영역: visibility에 따라 안정화
              const shouldShowStable = Math.random() < textVisibility * 0.8 + 0.2;
              row.push(shouldShowStable ? "S" : "·");
            } else if (dist < maxBlurDist) {
              // 글씨 주변: 거리에 따라 글리치 확률 감소
              const glitchProb = (1 - dist / maxBlurDist) * (1 - textVisibility) * 0.5;
              const shouldGlitch = Math.random() < glitchProb;
              row.push(shouldGlitch ? "$" : "·");
            } else {
              // 배경: 동심원 패턴 (젠 정원 모래 무늬)
              const centerX = dimensions.cols / 2;
              const centerY = dimensions.rows / 2;
              const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
              const waveFreq = 8; // 동심원 간격
              const wave = Math.sin(distFromCenter / waveFreq) * 0.5 + 0.5;
              // 물결 무늬: - 와 · 를 번갈아 사용
              row.push(wave > 0.5 ? "-" : "·");
            }
          }
          newGrid.push(row);
        }
        setGrid(newGrid);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, scrollProgress, textMatrices, isScrolling]);

  return (
    <div style={{ position: "relative" }}>
      {/* 스크롤 가능한 높이 확보 */}
      <div style={{ height: "500vh", width: "100%" }} />

      {/* 고정된 ASCII 디스플레이 */}
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#F5F0E6",
          overflow: "hidden",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          lineHeight: "16px",
          letterSpacing: "4px",
          fontWeight: "bold",
          color: "#1a1a1a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          margin: 0,
          zIndex: -1,
        }}
      >
        {grid.map((row, y) => (
          <div key={y} style={{ whiteSpace: "pre", margin: 0, padding: 0, height: "16px" }}>
            {row.join("")}
          </div>
        ))}
      </div>
    </div>
  );
}
