// Redirect with a relative Location header. Behind Render's proxy, request.url
// is the internal address (http://localhost:10000), so absolute redirects built
// from it would send the browser to the wrong host.
export function relativeRedirect(path: string, status = 303) {
  return new Response(null, { status, headers: { Location: path } });
}
