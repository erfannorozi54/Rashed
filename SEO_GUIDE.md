# SEO Optimization Guide for آموزشگاه ریاضی راشد تبریز

## Implemented SEO Features

### 1. **Meta Tags & Metadata**
- Comprehensive title tags with target keywords
- Meta descriptions optimized for Persian search
- Keywords meta tag with all target phrases
- Open Graph tags for social media sharing
- Twitter Card metadata
- Canonical URLs

### 2. **Structured Data (JSON-LD)**
- Educational Organization schema
- Local Business information
- Service offerings (کلاس خصوصی، کلاس یوس، etc.)
- Location data for Tabriz

### 3. **Content Optimization**
All target keywords integrated naturally:
- آموزش ریاضی ✓
- آموزشگاه ریاضی ✓
- کلاس خصوصی ریاضی ✓
- کلاس ریاضی تبریز ✓
- آموزشگاه راشد ✓
- آموزشگاه ریاضی راشد ✓
- آموزشگاه ریاضی تبریز ✓
- کلاس یوس ✓
- کلاس YOS ✓

### 4. **Technical SEO**
- `robots.txt` configured
- Dynamic `sitemap.xml`
- Web app manifest for PWA
- RTL language support (lang="fa" dir="rtl")
- Mobile-first responsive design
- Fast loading times with Next.js optimization

### 5. **Local SEO**
- Location mentioned: تبریز، آذربایجان شرقی
- Local business schema
- Contact information
- Area served specification

## Next Steps for Production

### 1. **Google Search Console**
```bash
# Add verification code to layout.tsx
verification: {
  google: "YOUR_VERIFICATION_CODE_HERE"
}
```

### 2. **Submit Sitemap**
- Go to Google Search Console
- Submit: `https://rashed-math.ir/sitemap.xml`

### 3. **Create Google My Business**
- Register business on Google Maps
- Add location, hours, photos
- Link to website

### 4. **Content Strategy**
- Write blog posts targeting each keyword
- Create pages for each service:
  - `/services/private-tutoring` (کلاس خصوصی)
  - `/services/yos-preparation` (کلاس یوس)
  - `/services/online-classes` (آموزش آنلاین)

### 5. **Backlinks**
- List on Iranian education directories
- Partner with schools in Tabriz
- Guest posts on education blogs
- Social media presence (Instagram, Telegram)

### 6. **Performance**
- Optimize images (WebP format)
- Enable caching
- Use CDN for static assets
- Monitor Core Web Vitals

### 7. **Analytics**
```bash
npm install @vercel/analytics
```
Add to layout.tsx for tracking

## Monitoring

### Track Rankings For:
1. آموزش ریاضی
2. آموزشگاه ریاضی تبریز
3. کلاس خصوصی ریاضی تبریز
4. کلاس یوس تبریز
5. آموزشگاه راشد

### Tools:
- Google Search Console
- Google Analytics
- Ahrefs / SEMrush (optional)

## Expected Timeline

- **Week 1-2**: Google indexing
- **Month 1**: Appear in search results
- **Month 2-3**: Ranking improvements
- **Month 3-6**: Top 10 for local keywords
- **Month 6+**: Top 3 for competitive keywords

## Important Notes

1. **Domain**: Update `siteConfig.url` to your actual domain
2. **Contact**: Add real phone number and address
3. **Images**: Add actual photos of institute
4. **Content**: Regularly publish blog posts
5. **Reviews**: Encourage student reviews on Google
