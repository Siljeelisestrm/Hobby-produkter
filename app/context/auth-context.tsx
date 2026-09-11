import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { fetchProfile, upsertProfile, type UserProfile } from "~/lib/auth";
import { getSupabaseClient } from "~/lib/supabase";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const existingProfile = await fetchProfile(user.id);
    if (existingProfile) {
      setProfile(existingProfile);
      return;
    }

    const createdProfile = await upsertProfile(user);
    setProfile(createdProfile);
  };

  useEffect(() => {
    const supabase = getSupabaseClient();

    const handleSession = async (session: Session | null) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => handleSession(data.session))
      .catch(() => {
        setUser(null);
        setIsLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void handleSession(session);
      },
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    void refreshProfile();
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isLoading,
      refreshProfile,
    }),
    [profile, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth må brukes inni AuthProvider.");
  }

  return context;
}
