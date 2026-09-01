# Pricing dataset provenance

The application uses a static MySQL seed snapshot; it does not call a provider pricing API at runtime. Every seeded price has `source=OFFICIAL_PROVIDER_DATA`, a source URL and effective date.

| Provider | Region | Configurations | Model | Source |
| --- | --- | --- | --- | --- |
| AWS EC2 | Mumbai (`ap-south-1`) | `t3.medium`, `t3.large`, `t3.xlarge`, `t3.2xlarge` | Linux shared On-Demand | [AWS public price list](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/ap-south-1/index.json) |
| Azure Virtual Machines | Central India (`centralindia`) | `Standard_D2s_v5`, `D4s_v5`, `D8s_v5`, `D16s_v5` | Consumption / on-demand | [Azure Retail Prices API](https://prices.azure.com/api/retail/prices) |
| Google Compute Engine | Mumbai (`asia-south1`) | `e2-standard-2`, `-4`, `-8`, `-16` | Default on-demand | [Google official pricing](https://cloud.google.com/products/compute/pricing/general-purpose) |

Seeded records are compute-only. These VM configurations have no bundled disk. No storage, egress, IP, or support price is seeded unless it can be verified from an official source and attributed at the same granularity. The cost API therefore reports each unpriced category as `0` and includes a coverage warning; it never substitutes a made-up rate.
