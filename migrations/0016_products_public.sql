-- 产品线都挂出去：产品广场上谁都能看。以后想收回来，在产品页的「编辑资料」里改回私有。
UPDATE products SET visibility = 'public' WHERE visibility = 'private';
