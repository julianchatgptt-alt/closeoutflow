import { serverEnv } from "@closeoutflow/env/server";
import { notFound } from "next/navigation";

import { DesignGallery } from "../../../components/gallery/design-gallery";
import { isDesignGalleryEnabled } from "./access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Component Gallery · CloseoutFlow" };

export default function Page() {
  if (!isDesignGalleryEnabled(serverEnv.APP_ENV)) notFound();
  return <DesignGallery />;
}
