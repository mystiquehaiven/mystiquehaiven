import WaitlistForm from "@/components/WaitlistForm";


export default function Home() {
  return (
<div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4">
  <h1 className="text-white text-2xl font-light tracking-widest uppercase">
    Coming Soon
  </h1>
  <h2>
    MYSTIQUE hAIven
  </h2>
  <h3>
    THE BEST NSFW AI GALLERY ON THE NET
  </h3>
  <WaitlistForm />
</div>
  );
}