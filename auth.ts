/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { client } from "./sanity/lib/client";
import { AUTHOR_BY_GITHUB_ID_QUERY } from "./sanity/lib/queries";
import { writeClient } from "./sanity/lib/write-client";

// Define auth configuration separately
export const authConfig = {
  providers: [GitHub],
  callbacks: {
    async signIn({ user, profile }: { user: any; profile: any }) {
      const existingUser = await client
        .withConfig({ useCdn: false })
        .fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
          id: profile?.id,
        });

      if (!existingUser) {
        await writeClient.create({
          _type: "author",
          id: profile.id,
          name: user.name,
          username: profile.login,
          email: user.email,
          image: user.image,
          bio: profile.bio || "",
        });
      }

      return true;
    },
    async jwt({ token, account, profile }: { token: any; account: any; profile: any }) {
      if (account && profile) {
        const user = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
            id: profile.id,
          });

        token.id = user?._id;
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.id = token.id as string;
      return session;
    },
  },
};

// Export NextAuth instance using authConfig
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
