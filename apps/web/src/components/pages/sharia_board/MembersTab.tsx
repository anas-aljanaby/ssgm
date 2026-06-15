import React, { useMemo, useState } from 'react';
import {
  Check,
  CirclePlus,
  LayoutGrid,
  List,
  Mail,
  Search,
  X,
} from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { ShariaBoardMember, ShariaBoardRole, ShariaMemberStatus } from '../../../types';
import { MOCK_SHARIA_BOARD_MEMBERS } from '../../../data/shariaBoardData';

interface MemberCardProps {
  member: ShariaBoardMember;
}

const MemberCard: React.FC<MemberCardProps> = ({ member }) => {
  const { t, language } = useLocalization(['sharia', 'common']);

  const statusConfig: Record<
    ShariaMemberStatus,
    { color: string; icon: React.ReactNode | null }
  > = {
    Active: { color: 'bg-green-500', icon: <Check size={10} className="text-white" /> },
    'On Leave': { color: 'bg-yellow-500', icon: null },
    Inactive: { color: 'bg-gray-400', icon: null },
  };

  const status = statusConfig[member.status];

  return (
    <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border border-gray-200 dark:border-slate-700 overflow-hidden text-center transition-transform hover:-translate-y-1">
      <div className="bg-sharia-primary/10 h-20" />
      <div className="relative px-4 pb-4 -mt-12">
        <img
          src={member.photoUrl}
          alt={member.name.en}
          className="w-24 h-24 rounded-full mx-auto border-4 border-card dark:border-dark-card shadow-lg"
        />
        <div className="absolute top-14 right-1/2 translate-x-1/2 translate-y-1/2">
          <span
            title={t(`sharia.board.statuses.${member.status.replace(' ', '')}`)}
            className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-card dark:border-dark-card ${status.color}`}
          >
            {status.icon}
          </span>
        </div>
        <h3 className="mt-4 font-bold text-lg">{member.name[language]}</h3>
        <p className="text-xs text-gray-500">{member.title[language]}</p>
        <div className="mt-2 text-sm font-semibold px-3 py-1 bg-sharia-secondary/20 text-sharia-secondary-dark dark:text-sharia-secondary rounded-full inline-block">
          {t(`sharia.board.roles.${member.role}`)}
        </div>
        <div className="mt-4 pt-4 border-t dark:border-slate-700 flex justify-center items-center gap-4 text-gray-500">
          <a
            href={`mailto:${member.email}`}
            className="hover:text-primary"
            aria-label={t('sharia.board.members.emailMember', { name: member.name[language] })}
            title={t('sharia.board.members.emailMember', { name: member.name[language] })}
          >
            <Mail size={18} />
          </a>
        </div>
      </div>
    </div>
  );
};

interface MembersListProps {
  members: ShariaBoardMember[];
}

const MembersList: React.FC<MembersListProps> = ({ members }) => {
  const { t, language } = useLocalization(['sharia']);

  const StatusBadge: React.FC<{ status: ShariaMemberStatus }> = ({ status }) => {
    const styles: Record<ShariaMemberStatus, string> = {
      Active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      'On Leave': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      Inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {t(`sharia.board.statuses.${status.replace(' ', '')}`)}
      </span>
    );
  };

  return (
    <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft overflow-hidden border border-gray-200 dark:border-slate-700/50">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-start text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-card/50 dark:text-gray-400">
            <tr>
              <th className="p-4">{t('sharia.board.table.member')}</th>
              <th className="p-4">{t('sharia.board.table.role')}</th>
              <th className="p-4">{t('sharia.board.table.status')}</th>
              <th className="p-4">{t('sharia.board.table.credentials')}</th>
              <th className="p-4 text-right">{t('sharia.board.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t dark:border-slate-700">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.photoUrl}
                      alt={member.name.en}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-bold text-foreground dark:text-dark-foreground">
                        {member.name[language]}
                      </p>
                      <p className="text-xs text-gray-500">{member.title[language]}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">{t(`sharia.board.roles.${member.role}`)}</td>
                <td className="p-4">
                  <StatusBadge status={member.status} />
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {member.credentials.map((cred) => (
                      <span
                        key={cred}
                        className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-slate-700 rounded-full"
                      >
                        {cred}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
                    aria-label={t('sharia.board.members.emailMember', { name: member.name[language] })}
                    title={t('sharia.board.members.emailMember', { name: member.name[language] })}
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

type NewMemberInput = {
  name: { en: string; ar: string };
  title: { en: string; ar: string };
  email: string;
  role: ShariaBoardRole;
  status: ShariaMemberStatus;
  photoUrl: string;
};

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: NewMemberInput) => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onAdd }) => {
  const { t } = useLocalization(['sharia', 'common']);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShariaBoardRole>('Member');
  const [status, setStatus] = useState<ShariaMemberStatus>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onAdd({
      name: { en: nameEn, ar: nameAr },
      title: { en: titleEn, ar: titleAr },
      email,
      role,
      status,
      photoUrl: `https://picsum.photos/seed/${nameEn.replace(/\s/g, '')}/200/200`,
    });
    setNameEn('');
    setNameAr('');
    setTitleEn('');
    setTitleAr('');
    setEmail('');
    setRole('Member');
    setStatus('Active');
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold">{t('sharia.board.members.add')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">{t('sharia.board.form.nameEn')}</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">{t('sharia.board.form.nameAr')}</label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  required
                  dir="rtl"
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">{t('sharia.board.form.titleEn')}</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">{t('sharia.board.form.titleAr')}</label>
                <input
                  type="text"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  required
                  dir="rtl"
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">{t('sharia.board.form.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">{t('sharia.board.form.role')}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ShariaBoardRole)}
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                >
                  {(['Chairman', 'Member', 'Secretary', 'Observer'] as const).map((r) => (
                    <option key={r} value={r}>
                      {t(`sharia.board.roles.${r}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">{t('sharia.board.form.status')}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ShariaMemberStatus)}
                  className="w-full p-2 mt-1 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                >
                  {(['Active', 'On Leave', 'Inactive'] as const).map((s) => (
                    <option key={s} value={s}>
                      {t(`sharia.board.statuses.${s.replace(' ', '')}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold disabled:opacity-60"
            >
              {t('sharia.board.members.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MembersTab: React.FC = () => {
  const { t } = useLocalization(['sharia']);
  const [members, setMembers] = useState<ShariaBoardMember[]>(MOCK_SHARIA_BOARD_MEMBERS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filtered = useMemo(
    () =>
      members.filter((member) => {
        const matchesSearch =
          member.name.en.toLowerCase().includes(search.toLowerCase()) ||
          member.name.ar.includes(search);
        const matchesRole = roleFilter === 'all' || member.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      }),
    [members, search, roleFilter, statusFilter],
  );

  const handleAdd = (input: NewMemberInput) => {
    const newMember: ShariaBoardMember = {
      ...input,
      id: `sbm-${Date.now()}`,
      credentials: [],
      bio: { en: '', ar: '' },
    };
    setMembers((prev) => [newMember, ...prev]);
    setIsAddOpen(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="p-4 bg-card dark:bg-dark-card rounded-xl shadow-soft border dark:border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('sharia.board.members.searchPlaceholder')}
                className="w-full p-2 pl-10 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="p-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
            >
              <option value="all">{t('sharia.board.members.allRoles')}</option>
              {(['Chairman', 'Member', 'Secretary', 'Observer'] as const).map((r) => (
                <option key={r} value={r}>
                  {t(`sharia.board.roles.${r}`)}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
            >
              <option value="all">{t('sharia.board.members.allStatuses')}</option>
              {(['Active', 'On Leave', 'Inactive'] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`sharia.board.statuses.${s.replace(' ', '')}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="p-1 bg-gray-200 dark:bg-slate-700 rounded-lg flex">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg"
          >
            <CirclePlus className="w-4 h-4" />
            {t('sharia.board.members.add')}
          </button>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <MembersList members={filtered} />
        )}
      </div>

      <AddMemberModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdd={handleAdd} />
    </>
  );
};

export default MembersTab;
