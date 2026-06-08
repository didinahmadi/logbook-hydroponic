"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Toaster richColors position="top-right" />
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 text-green-700">
            <Leaf className="h-8 w-8" />
            <span className="text-2xl font-bold">Hidro Logbook</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Akun</CardTitle>
            <CardDescription>Buat akun baru untuk mulai mencatat</CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-green-700 font-medium">Pendaftaran berhasil!</p>
                <p className="text-sm text-gray-600">
                  Cek email Anda untuk konfirmasi, lalu{" "}
                  <Link href="/login" className="text-green-600 font-medium hover:underline">
                    masuk
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@contoh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? "Memproses..." : "Daftar"}
                </Button>
              </form>
            )}

            {!done && (
              <p className="text-center text-sm text-gray-600 mt-4">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-green-600 font-medium hover:underline">
                  Masuk
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
