// This route only serves to be ping in the docker compose healtcheck.
export async function GET() {
	return new Response(JSON.stringify({ status: 'ok' }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
