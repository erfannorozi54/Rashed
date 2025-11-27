import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "آموزشگاه ریاضی راشد تبریز",
        short_name: "راشد",
        description: "آموزشگاه ریاضی راشد - بهترین آموزشگاه ریاضی در تبریز",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#6366f1",
        orientation: "portrait",
        dir: "rtl",
        lang: "fa",
        icons: [
            {
                src: "/icon-192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
