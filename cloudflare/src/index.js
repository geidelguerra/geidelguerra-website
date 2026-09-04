// Worker entrypoint for running the geidelguerra.com website (the Go
// binary built from the repository root) as a Cloudflare Container. See
// README.md > Deployment > Cloudflare Containers and ../deploy_cloudflare.sh.
import { env } from "cloudflare:workers";
import { Container, getContainer } from "@cloudflare/containers";

// Must match the port the Go binary listens on inside the container (see
// PORT below and main.go). HOST is intentionally left unset there so it
// binds all interfaces, which Cloudflare's Containers runtime requires in
// order to reach it.
const CONTAINER_PORT = 8080;

export class Website extends Container {
	defaultPort = CONTAINER_PORT;
	// Stop the container after 30 minutes without a request, so Container
	// Memory/Disk billing (see
	// https://developers.cloudflare.com/containers/platform/pricing/) stops
	// too while this low-traffic site is idle overnight. The keep-warm Cron
	// Trigger below (see wrangler.jsonc `triggers.crons`) pings periodically
	// during business hours, so in practice this only kicks in outside that
	// window — the next request after that pays a cold start (documented at
	// ~1-3s: see
	// https://developers.cloudflare.com/containers/concepts/architecture/#cold-starts).
	// Raise this (or set it very high) if that latency matters more than
	// the savings, or shrink the cron's business-hours window instead.
	sleepAfter = "30m";
	envVars = {
		PORT: String(CONTAINER_PORT),
	};
}

export default {
	async fetch(request) {
		// A single, on-demand instance is enough for this low-traffic
		// portfolio site. For higher availability/throughput, switch to
		// `getRandom(env.WEBSITE, N)` instead (see
		// https://developers.cloudflare.com/containers/examples/stateless/)
		// and raise `max_instances` in wrangler.jsonc to match.
		return getContainer(env.WEBSITE).fetch(request);
	},

	// Keep-warm ping, run on the Cron Trigger schedule in wrangler.jsonc's
	// `triggers.crons`. This `.fetch()` call starts the container if it
	// isn't already running (see the Container class's default `fetch`
	// behavior), which resets its `sleepAfter` timer — so as long as pings
	// arrive more often than `sleepAfter`, the container stays warm through
	// the whole window and only cold-starts once, outside business hours.
	// Hits /robots.txt (always a cheap, static 200) rather than a
	// dedicated health-check route, since this app doesn't have one.
	// Failures are logged and swallowed: a missed keep-warm ping should
	// never surface as an error anywhere real traffic can see it.
	async scheduled() {
		try {
			await getContainer(env.WEBSITE).fetch(new Request("https://keep-warm.invalid/robots.txt"));
		} catch (err) {
			console.error("keep-warm ping failed:", err);
		}
	},
};
