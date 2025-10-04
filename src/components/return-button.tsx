import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

interface ReturnButtonProps {
  href: string;
  label: string;
}

export const ReturnButton = ({ href, label }: ReturnButtonProps) => {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      asChild 
      className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
    >
      <Link href={href} className="flex items-center gap-2">
        <ArrowLeftIcon className="h-4 w-4" /> {label}
      </Link>
    </Button>
  );
};