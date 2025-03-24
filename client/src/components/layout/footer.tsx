import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-darkBg border-t border-border dark:border-darkBorderColor py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="text-primary font-bold text-xl mb-1">CryptoTrade</div>
            <div className="text-muted-foreground text-sm">© {new Date().getFullYear()} CryptoTrade. All rights reserved.</div>
          </div>
          <div className="flex space-x-6">
            <Link href="/terms">
              <a className="text-muted-foreground hover:text-primary">Terms</a>
            </Link>
            <Link href="/privacy">
              <a className="text-muted-foreground hover:text-primary">Privacy</a>
            </Link>
            <Link href="/security">
              <a className="text-muted-foreground hover:text-primary">Security</a>
            </Link>
            <Link href="/help">
              <a className="text-muted-foreground hover:text-primary">Help Center</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
