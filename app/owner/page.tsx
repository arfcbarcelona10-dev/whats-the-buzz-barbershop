import type { Metadata } from "next";
import { OwnerApp } from "./OwnerApp";

export const metadata: Metadata = {
  title: "Owner Studio | What's The Buzz?",
  description: "Private appointment and shop management for What's The Buzz?",
};

export default function OwnerPage() {
  return <OwnerApp />;
}
