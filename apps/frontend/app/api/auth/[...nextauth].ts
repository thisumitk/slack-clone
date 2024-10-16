import prisma from "@repo/db/prisma";
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt";
import { z } from "zod";
import { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";

  const credentialsScema = z.object({

    email: z.string().email(),
    password: z.string()
              .min(8)
              .max(20)
              .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).*$/)
              .refine((password) => !/\s/.test(password), "Password cannot contain whitespace")
  })  

export const authOptions = {

  providers: [
    CredentialsProvider({
        name : 'Email',
        credentials: {
            email: { label: "Email", type: "text", placeholder: "example@gmail.com" },
            password: { label: "Password", type: "password" }
          },
        
          async authorize(credentials){

            if (!credentials) return null;
            const parsedCredentials = credentialsScema.safeParse(credentials);
                if (!parsedCredentials.success) {
                    console.error("Invalid input:", parsedCredentials.error);
                    return null;
                }

                const { email, password } = parsedCredentials.data;

            const existingUser = await prisma.user.findFirst({
              where: {
                  email
              }
          });

          if (existingUser) {
              const passwordValidation = await bcrypt.compare(password, existingUser.password);
              if (passwordValidation) {
                  return {
                      id: existingUser.id.toString(),
                      name: existingUser.name,
                      email: existingUser.email
                  }
              }
              console.error("Invalid password for user:", email);
              return null;
          }

          try {
              const hashedPassword = await bcrypt.hash(password, 10);
              const user = await prisma.user.create({
                  data: {
                      email: email,
                      password: hashedPassword
                  }
              });
          
              return {
                  id: user.id.toString(),
                  name: user.name,
                  email: user.email
              }
          } catch(e) {
              console.error(e);
          }

          return null

          }
    })

  ],

  callbacks: {
    async jwt({ token, user } : { token : JWT; user? : User}) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ token, session } : { token: JWT; session: Session }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  /* pages: {
    signIn: '/auth/signin',
  }, */
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
}