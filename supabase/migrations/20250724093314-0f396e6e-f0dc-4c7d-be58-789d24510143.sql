-- Clean up problematic URL patterns with missing placeholder handling
UPDATE public.url_patterns 
SET pattern_template = CASE 
  WHEN pattern_template = '/ma/acquisition-report/{target}?deal={id}&status={phase}' 
  THEN '/ma/acquisition-report/{target}?deal={encrypted}&status={phase}'
  ELSE pattern_template
END
WHERE pattern_template LIKE '%{id}%' AND pattern_template NOT LIKE '%{encrypted}%';

-- Update patterns to ensure they all have proper encrypted parameter placement
UPDATE public.url_patterns 
SET pattern_template = CASE 
  WHEN pattern_template NOT LIKE '%{encrypted}%' AND pattern_template LIKE '%?%'
  THEN pattern_template || '&data={encrypted}'
  WHEN pattern_template NOT LIKE '%{encrypted}%' AND pattern_template NOT LIKE '%?%'
  THEN pattern_template || '?data={encrypted}'
  ELSE pattern_template
END
WHERE pattern_template NOT LIKE '%{encrypted}%';