export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = decodeURIComponent(url.pathname);

      console.log(`Handling request for path: ${pathname}`);

      // Check if the request is for a .pmtiles file
      if (pathname.endsWith(".pmtiles")) {
        // Fetch the .pmtiles file from the R2 bucket
        const pmtilesFile = await env.BUCKET.get(pathname.replace('/v1/', ''));

        if (!pmtilesFile) {
          console.log(`PMTiles file not found: ${pathname}`);
          return new Response("PMTiles file not found", { status: 404 });
        }

        const headers = new Headers();
        headers.set("Content-Type", "application/x-protobuf");  // PMTiles MIME type
        headers.set("Access-Control-Allow-Origin", "*");  // Allow CORS

        // Handle byte-range requests for partial file access (useful for large files)
        const rangeHeader = request.headers.get("Range");
        if (rangeHeader) {
          const byteRange = rangeHeader.match(/bytes=(\d+)-(\d*)/);

          if (byteRange) {
            const start = parseInt(byteRange[1], 10);
            const end = byteRange[2] ? parseInt(byteRange[2], 10) : undefined;

            const partialFile = await env.BUCKET.get(pathname.replace('/v1/', ''), {
              range: { offset: start, length: end ? end - start + 1 : undefined }
            });

            if (!partialFile) {
              return new Response("Range Not Satisfiable", { status: 416 });
            }

            headers.set(
              "Content-Range",
              `bytes ${start}-${start + partialFile.size - 1}/${pmtilesFile.size}`
            );
            headers.set("Content-Length", `${partialFile.size}`);
            return new Response(partialFile.body, {
              status: 206,  // Partial content response
              headers,
            });
          }
        }

        // Serve the entire .pmtiles file if no range is requested
        return new Response(pmtilesFile.body, {
          headers,
          status: 200,
        });
      }

      // Return 404 if the request does not match any .pmtiles file
      return new Response("Not Found", { status: 404 });

    } catch (error) {
      console.error("Error handling request:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
