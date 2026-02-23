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
        icons: [],
    };
}
