
-- Function to refresh all profile statistics
CREATE OR REPLACE FUNCTION public.refresh_all_profile_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update check-in counts
  UPDATE public.profiles p
  SET total_check_ins = (
    SELECT COUNT(*) 
    FROM public.check_ins c 
    WHERE c.user_id = p.id
  );
  
  -- Update unique venue counts
  UPDATE public.profiles p
  SET unique_venues = (
    SELECT COUNT(DISTINCT venue_name) 
    FROM public.check_ins c 
    WHERE c.user_id = p.id
  );
  
  -- Update badge counts
  UPDATE public.profiles p
  SET total_badges = (
    SELECT COUNT(*) 
    FROM public.badges b 
    WHERE b.user_id = p.id
  );
END;
$$;

-- Create a trigger to automatically update profile stats after check-ins
CREATE OR REPLACE FUNCTION public.update_profile_stats_on_check_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's profile stats
  UPDATE public.profiles
  SET 
    total_check_ins = (SELECT COUNT(*) FROM public.check_ins WHERE user_id = NEW.user_id),
    unique_venues = (SELECT COUNT(DISTINCT venue_name) FROM public.check_ins WHERE user_id = NEW.user_id)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to check_ins table
DROP TRIGGER IF EXISTS on_check_in_update_profile_stats ON public.check_ins;
CREATE TRIGGER on_check_in_update_profile_stats
AFTER INSERT OR UPDATE OR DELETE ON public.check_ins
FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats_on_check_in();

-- Create a trigger to automatically update profile stats after badge changes
CREATE OR REPLACE FUNCTION public.update_profile_stats_on_badge_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update the user's profile stats
    UPDATE public.profiles
    SET total_badges = (SELECT COUNT(*) FROM public.badges WHERE user_id = NEW.user_id)
    WHERE id = NEW.user_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update the user's profile stats
    UPDATE public.profiles
    SET total_badges = (SELECT COUNT(*) FROM public.badges WHERE user_id = OLD.user_id)
    WHERE id = OLD.user_id;
    
    RETURN OLD;
  END IF;
END;
$$;

-- Attach trigger to badges table
DROP TRIGGER IF EXISTS on_badge_change_update_profile_stats ON public.badges;
CREATE TRIGGER on_badge_change_update_profile_stats
AFTER INSERT OR UPDATE OR DELETE ON public.badges
FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats_on_badge_change();
