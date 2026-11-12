-- #226: the time tracker is deleted; podcasts and penon moved out of Todzz into standalone
-- local apps. Their data was exported before this ran (kept outside the repo).
DROP VIEW IF EXISTS public.tracker_daily_stats;
DROP VIEW IF EXISTS public.tracker_category_stats;
DROP TABLE IF EXISTS
  public.tracker_category_apps,
  public.tracker_keywords,
  public.tracker_sessions,
  public.tracker_apps,
  public.tracker_categories,
  public.podcasts,
  public.penon;
DROP FUNCTION IF EXISTS public.update_tracker_updated_at();
