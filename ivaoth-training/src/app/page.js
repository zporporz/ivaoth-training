import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8">
      
      <Image
        src="/logo.png"
        alt="IVAO Thailand"
        width={500}
        height={200}
        priority
      />

      <div className="text-center">
        <h1 className="text-5xl font-bold">
          Training Department
        </h1>

        <p className="text-zinc-400 mt-4 text-lg">
          IVAO Thailand Training Portal
        </p>
      </div>

    </main>
  );
}