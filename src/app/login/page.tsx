import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteFooter } from "@/components/site-footer";

const ERRORS: Record<string, string> = {
  wrong: "Vale parool. Proovi uuesti.",
  config: "Rakendus pole seadistatud: APP_PASSWORD on määramata.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Music className="size-6" />
            </div>
            <CardTitle className="text-xl">Esinemisarved</CardTitle>
            <CardDescription>Sisesta parool, et jätkata.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/login" method="post" className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Parool</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                  aria-invalid={message ? true : undefined}
                />
              </div>
              {message && (
                <p role="alert" className="text-sm text-destructive">
                  {message}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full">
                Logi sisse
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
