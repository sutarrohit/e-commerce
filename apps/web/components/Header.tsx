import { ShoppingBag } from "lucide-react";
import Link from "next/link";

const Header = () => (
  <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
    <div className='flex items-center justify-between h-16 px-6 max-w-4'>
      <Link href='/' className='flex items-center gap-2 text-lg'>
        <ShoppingBag className='size-5' />
        Ecommerce
      </Link>
    </div>
  </header>
);

export default Header;
