import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "~/lib/supabase";

const PROFILE_IMAGE_BUCKET = "profile-images";

export type UserProfile = {
  id: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
};

type ProfileRow = {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
};

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  username: string;
  bio?: string;
  avatarFile?: File;
}): Promise<void> {
  const supabase = getSupabaseClient();
  let avatarUrl: string | null = null;

  if (input.avatarFile && input.avatarFile.size > 0) {
    const extension = input.avatarFile.name.includes(".")
      ? input.avatarFile.name.split(".").pop()?.toLowerCase() ?? "jpg"
      : "jpg";
    const filePath = `avatars/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_IMAGE_BUCKET)
      .upload(filePath, input.avatarFile, {
        upsert: false,
        contentType: input.avatarFile.type || undefined,
      });

    if (uploadError) {
      throw new Error(`Klarte ikke laste opp profilbilde: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from(PROFILE_IMAGE_BUCKET)
      .getPublicUrl(filePath);
    avatarUrl = data.publicUrl;
  }

  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        username: input.username,
        bio: input.bio ?? null,
        avatar_url: avatarUrl,
      },
    },
  });

  if (error) {
    throw new Error(`Klarte ikke opprette bruker: ${error.message}`);
  }
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw new Error(`Klarte ikke logge inn: ${error.message}`);
  }
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Klarte ikke logge ut: ${error.message}`);
  }
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, bio, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Klarte ikke hente profil: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProfile(data as ProfileRow);
}

export async function upsertProfile(
  user: User,
  username?: string,
): Promise<UserProfile> {
  const supabase = getSupabaseClient();
  const fallbackUsername =
    username?.trim() ||
    String(user.user_metadata?.username ?? "").trim() ||
    user.email?.split("@")[0] ||
    `bruker-${user.id.slice(0, 8)}`;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username: fallbackUsername,
        bio: user.user_metadata?.bio ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      },
      { onConflict: "id" },
    )
    .select("id, username, bio, avatar_url")
    .single();

  if (error) {
    throw new Error(`Klarte ikke lagre profil: ${error.message}`);
  }

  return mapProfile(data as ProfileRow);
}
