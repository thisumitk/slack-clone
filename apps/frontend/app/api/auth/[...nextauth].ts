import prisma from "@repo/db/prisma";
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt";
import { z } from "zod";
import { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import jwt from 'jsonwebtoken';

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
                      // .ENV REsolution needs to be done.
                      const token = jwt.sign({ id : existingUser.id, email: existingUser.email}, process.env.JWT_SECRET || 'mysecret', { expiresIn : '1h'});
                  return {
                      id: existingUser.id.toString(),
                      name: existingUser.name,
                      email: existingUser.email,
                      accessToken : token
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
              const token = jwt.sign({ id : user.id, email: user.email}, process.env.JWT_SECRET || 'mysecret', { expiresIn : '1h'});
              return {
                  id: user.id.toString(),
                  name: user.name,
                  email: user.email,
                  accessToken : token
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
        token.email = user.email;
        token.accessToken = user.accessToken
      }
      return token;
    },
    async session({ token, session } : { token: JWT; session: Session }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.accessToken = token.accessToken as string;
        console.log(session);
      }
      return session;
    }
  },
  /*pages: {
    signIn: '/auth/signin',
  },*/
  secret : process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
}