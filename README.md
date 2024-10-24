# Creating Protomaps Map Tile Provider for Grid Self-Hosting

The Grid mobile app enables users to set their own backend server and map tile provider through the "Custom Provider" interface. In its current state, Grid is configured for utilization of PMTiles from Protomaps. Protomaps is a free and open source map of the world. To learn more about Protomaps, check out their website: [Protomaps](http://protomaps.com/).

#### What are PMTiles?

> "PMTiles is a single-file archive format for tiled data. A PMTiles archive can be hosted on a commodity storage platform such as S3, and enables low-cost, zero-maintenance map applications that are "serverless" - free of a custom tile backend or third party provider." - Protomaps Documentation




### Step 1: Download Protomaps Build (.pmtiles)
The first step to creating a Protomaps map tile provider is to generate a .pmtiles file. To do so, you first need to download the latest build (approximately 106GB) [here](https://maps.protomaps.com/builds/).

### Step 2: Extract Desired Region (optional)
If you only require or desire maps for a specific region (state, country, etc), you can extract a specific region utilizing the pmtiles CLI, documentation and instructions for that is located [here](https://docs.protomaps.com/guide/getting-started).

### Step 3: Upload to Cloudflare R2 / Host .pmtiles
Currently, we have Grid configured to utilize a Cloudflare R2 bucket to host the large .pmtiles. This is for a few reasons:
* Privacy - Cloudflare is a company that values privacy ([privacy policy](https://www.cloudflare.com/trust-hub/privacy-and-data-protection/)).
* R2 buckets are very cheap for not only hosting but for serving data, making it cost practically pennies.
* A large majority of "self-hosters" utilize Cloudflare for DNS, and it is a fairly low barrier to entry to create a R2 bucket and Cloudflare worker versus hosting on-prem a map tile server like OpenStreetMaps.
* Much simpler than serving tiles, sprites, fonts, etc.
* It's aesthetic.

In the future, OpenStreetMaps can be implemented as an additional feature.

To add your .pmtiles file to R2, follow documentation [here](https://docs.protomaps.com/pmtiles/cloud-storage).

You will mainly have to setup the tool rclone on your local machine with an API key, and run:
```bash
rclone copyto my-filename my-configuration:my-bucket/my-folder/my-filename.pmtiles --progress --s3-chunk-size=256M
```
Once uploaded, your R2 bucket should contain a "protomaps.pmtiles" file approximately 100-130GB in size.

There are alternatives to self-host such as [MinIO](https://github.com/minio/minio) however it has not been tested yet.

####

### Step 3: Create Cloudflare Worker / Serve Tiles

If using Cloudflare R2, navigate to Cloudflare and create a worker. In serverless/cloudflare configure your wrangler.toml for your R2 Bucket. Utilize wrangler to build/push remotely to Cloudflare. For more documentation from Protomaps, go [here](https://docs.protomaps.com/deploy/cloudflare).

To create a self-hosted worker, use Node to create a simple HTTP server using the same code in /serverless/src/index.ts.


### Step 4: Route DNS

Point a domain (maps.yourcool.domain) to your Cloudflare Worker or use your static IP if you have one.

### Step 5: Configure Custom Provider in App

On the landing page of Grid, press Custom Provider and next to Maps URL enter:
```bash
https://your.cool.domain/v1/protomaps.pmtiles
```

Congratulations, you should now have a working map tile server.




## License

The reference implementations of PMTiles are published under the BSD 3-Clause License. The PMTiles specification itself is public domain, or under a CC0 license where applicable.
