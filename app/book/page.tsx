import type { Metadata } from "next";
import { BookingApp } from "./BookingApp";

export const metadata: Metadata = {
  title: "Book an Appointment | What's The Buzz?",
  description: "Choose your service and reserve a time at What's The Buzz? in Schofield, Wisconsin.",
};

export default function BookingPage() {
  return <BookingApp />;
}
