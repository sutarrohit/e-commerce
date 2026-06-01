import { ShoppingBag, ShoppingCart } from "lucide-react";
import Link from "next/link";

const Header = () => (
  <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
    <div className='flex items-center justify-between h-16 px-6 border'>
      <div>
        <Link href='/' className='flex items-center gap-2 text-lg font-semibold'>
          <ShoppingBag className='size-5' />
          Ecommerce
        </Link>
      </div>

      <div>
        <Link
          href='/checkout'
          className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
        >
          <ShoppingCart className='size-4' />
          Cart
        </Link>
      </div>
    </div>
  </header>
);

export default Header;
