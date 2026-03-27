import { buildUrl } from "@/utils/buildUrl";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=M+PLUS+2&family=Montserrat&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href={buildUrl("/favicon.svg")} type="image/svg+xml" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL@0..1&icon_names=chat_bubble,close,description,menu,mic,more_horiz,send&display=block"
          rel="stylesheet"
        />
      </Head>
      <body style={{ backgroundImage: `url(${buildUrl("/bg-d.png")})` }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
