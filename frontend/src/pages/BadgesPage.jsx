import { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import BadgeCard, { AchievementBadgeCard } from '../components/BadgeCard';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';

const TOTAL_BADGES = 8;

export default function BadgesPage() {
  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        setError('');
        const [badgesRes, dashRes] = await Promise.all([
          axiosInstance.get('/api/rewards/badges'),
          axiosInstance.get('/api/dashboard/employee'),
        ]);
        setBadges(badgesRes.data.data.badges);
        setAchievements(dashRes.data.data?.achievements ?? []);
      } catch (err) {
        const message =
          err?.response?.data?.detail?.message ||
          err?.response?.data?.detail ||
          'Failed to load badges. Please try again.';
        setError(typeof message === 'string' ? message : 'Failed to load badges. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  const earnedCount = badges.filter((b) => b.earned).length;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <p className="page-lead">
        {earnedCount} of {TOTAL_BADGES} module badges earned
      </p>

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      {!error && (
        <>
          <section className="space-y-3">
            <h2 className="section-title">Module badges</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {badges.map((badge) => (
                <BadgeCard key={badge.module_id} badge={badge} />
              ))}
            </div>
          </section>

          {achievements.length > 0 && (
            <section className="space-y-3">
              <h2 className="section-title">Achievements</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {achievements.map((achievement) => (
                  <AchievementBadgeCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
