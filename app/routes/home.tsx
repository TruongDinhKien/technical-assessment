import { FeedbackContainer } from "~/components/Feedbacks";
import type { Route } from "./+types/home";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <main className="flex items-center justify-center">
    <div className="w-full space-y-6 px-4">
      <FeedbackContainer />
    </div>
  </main>;
}
