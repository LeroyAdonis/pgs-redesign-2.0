/**
 * Root layout — minimal passthrough.
 *
 * The <html> and <body> tags are rendered by the [locale]/layout.tsx
 * so that `lang` is set dynamically from the URL locale segment.
 * This layout only forwards children.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
