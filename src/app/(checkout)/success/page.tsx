import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <Container className="py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Successful</h1>
        <p className="text-lg text-gray-600 mb-8">Thank you for your purchase!</p>
        <div className="flex gap-4 justify-center">
          <Link href="/account">
            <Button>View Bookings</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
