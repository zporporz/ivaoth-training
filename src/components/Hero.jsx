import Button from "./ui/Button";

const trainingTypes = ["AS1", "AS2", "AS3", "ADC", "APC", "ACC", "GCA"];

export default function Hero() {
  return (
    <div className="rounded-[36px] border border-white/60 bg-white/70 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur hover:-translate-y-1 transition duration-300 md:p-12">
      
      <div className="mb-5 inline-flex rounded-full border border-[#dddbd6] bg-[#fbfbfa] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#4b4b48]">
        IVAO Thailand Training Portal
      </div>

      <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.04em] text-[#0a0a0a] md:text-7xl">
        Train smarter.
        <br />
        Control cleaner.
      </h1>

      <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#4b4b48]">
        Manage training requests, staff sessions, trainee progress, and rating workflows
        in one clean portal for IVAO Thailand.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
  <Button>Request Training</Button>
  <Button variant="secondary">Staff Console</Button>
</div>

      <div className="mt-10 flex flex-wrap gap-3">
        {trainingTypes.map((type) => (
          <span
            key={type}
            className="rounded-full border border-[#dddbd6] bg-[#fbfbfa] px-4 py-2 text-xs font-black text-[#4b4b48] shadow-sm"
          >
            {type}
          </span>
        ))}

        <span className="rounded-full border border-[#16a34a] bg-[#e3f7ea] px-4 py-2 text-xs font-black text-[#0b6e35] shadow-sm">
          LIVE TRAINING
        </span>

        <span className="rounded-full border border-[#ff5a1f] bg-[#ffe6db] px-4 py-2 text-xs font-black text-[#b9481d] shadow-sm">
          STAFF ONLINE
        </span>
      </div>
    </div>
  );
}