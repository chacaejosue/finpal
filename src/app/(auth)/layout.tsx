import { ThemeReset } from "@/components/theme-reset";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeReset />
      {children}
    </>
  );
}
