import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmails = [
  "sehrkhan873@gmail.com",
  "teacher2@gmail.com",
  "admin@gmail.com",
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/no-access",
  },
  callbacks: {
    signIn({ user }) {
      if (!user.email) return false;
      return allowedEmails.includes(user.email);
    },
  },
});
