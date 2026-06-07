import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email", placeholder: "admin@universidad.edu" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // Si el usuario no existe, creamos el primero si la base está vacía
        if (!user) {
          const count = await prisma.user.count();
          if (count === 0) {
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            const newUser = await prisma.user.create({
              data: {
                name: "Administrador Inicial",
                email: credentials.email,
                password: hashedPassword,
                role: "ADMIN"
              }
            });
            return { 
              id: newUser.id, 
              name: newUser.name ?? "Admin", 
              email: newUser.email ?? "", 
              role: newUser.role ?? "ADMIN" 
            };
          }
          return null;
        }

        // CORRECCIÓN VITAL AQUÍ:
        // Añadimos "|| ''" para que nunca sea null y TypeScript no se queje
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password || "");

        if (!isPasswordValid) {
          return null;
        }

        return { 
          id: user.id, 
          name: user.name ?? "Usuario", 
          email: user.email ?? "", 
          role: user.role ?? "ADMIN" 
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = (token.role as string) ?? "ADMIN";
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }