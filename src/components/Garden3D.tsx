// 3D Garden placeholder component
// TODO: Three.js 또는 Spline으로 정원 3D 씬 구현

export default function Garden3D() {
  return (
    <div className="w-full h-64 bg-gradient-to-b from-green-100 to-green-200 rounded-lg flex items-center justify-center mb-8">
      <div className="text-center text-green-800">
        <p className="text-lg font-medium">🌱 3D 정원이 들어올 자리</p>
        <p className="text-sm opacity-70">Three.js / Spline 연동 예정</p>
      </div>
    </div>
  );
}
