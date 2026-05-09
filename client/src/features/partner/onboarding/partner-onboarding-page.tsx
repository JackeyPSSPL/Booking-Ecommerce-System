import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { propertiesApi } from '../../../api/properties.api';
import { getApiError } from '../../../utils/error';
import PartnerLayout from '../partner-layout';

// ── Wizard state shape ────────────────────────────────────────────────────────

interface WizardState {
  // Step 1
  name: string;
  address: string;
  city: string;
  postcode: string;
  category: string;
  starRating: number;
  // Step 2
  amenities: string[];
  description: string;
  bookingMode: string;
  // Step 3 (images as URL strings for MVP)
  imageUrls: string[];
  // Step 4
  basePrice: string;
  mealPlan: string;
  cancellationPolicy: string;
  // Step 5
  entityType: string;
  legalFirstName: string;
  legalLastName: string;
  pan: string;
  phone: string;
}

const INITIAL: WizardState = {
  name: '', address: '', city: '', postcode: '', category: 'HOTEL', starRating: 3,
  amenities: [], description: '', bookingMode: 'INSTANT',
  imageUrls: [''],
  basePrice: '', mealPlan: 'NONE', cancellationPolicy: 'FLEXIBLE',
  entityType: 'INDIVIDUAL', legalFirstName: '', legalLastName: '', pan: '', phone: '',
};

const AMENITY_LIST = ['WiFi', 'Parking', 'AC', 'Pool', 'Kitchen', 'Gym', 'Elevator', 'Breakfast'];

const STEPS = ['Basic Info', 'Property Setup', 'Photos', 'Pricing', 'Legal', 'Review'];

// ── Step components ───────────────────────────────────────────────────────────

function FieldRow({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#003580] transition-colors"
    />
  );
}

function Step1({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-4">
      <FieldRow label="Property name *">
        <TextInput value={s.name} onChange={v => set({ name: v })} placeholder="e.g. The Grand Manali" />
      </FieldRow>
      <FieldRow label="Street address *">
        <TextInput value={s.address} onChange={v => set({ address: v })} placeholder="Full street address" />
      </FieldRow>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="City *">
          <TextInput value={s.city} onChange={v => set({ city: v })} placeholder="City" />
        </FieldRow>
        <FieldRow label="Postcode">
          <TextInput value={s.postcode} onChange={v => set({ postcode: v })} placeholder="Postcode" />
        </FieldRow>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Category *">
          <select
            value={s.category}
            onChange={e => set({ category: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#003580]"
          >
            {['HOTEL', 'APARTMENT', 'VILLA', 'HOSTEL', 'OTHER'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Star rating">
          <select
            value={s.starRating}
            onChange={e => set({ starRating: Number(e.target.value) })}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#003580]"
          >
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>)}
          </select>
        </FieldRow>
      </div>
    </div>
  );
}

function Step2({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const toggleAmenity = (a: string) => {
    set({ amenities: s.amenities.includes(a) ? s.amenities.filter(x => x !== a) : [...s.amenities, a] });
  };
  return (
    <div className="space-y-5">
      <FieldRow label="Description">
        <textarea
          value={s.description}
          onChange={e => set({ description: e.target.value })}
          rows={4}
          maxLength={2000}
          placeholder="Describe your property — what makes it special?"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#003580] resize-none"
        />
      </FieldRow>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {AMENITY_LIST.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                s.amenities.includes(a)
                  ? 'bg-[#003580] text-white border-[#003580]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#003580]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <FieldRow label="Booking mode">
        <div className="flex gap-4">
          {['INSTANT', 'REQUEST'].map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="bookingMode"
                value={m}
                checked={s.bookingMode === m}
                onChange={() => set({ bookingMode: m })}
                className="accent-[#003580]"
              />
              <span className="text-sm text-gray-700">{m === 'INSTANT' ? 'Instant Booking' : 'Request to Book'}</span>
            </label>
          ))}
        </div>
      </FieldRow>
    </div>
  );
}

function Step3({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  const updateUrl = (i: number, v: string) => {
    const next = [...s.imageUrls]; next[i] = v; set({ imageUrls: next });
  };
  const addUrl = () => set({ imageUrls: [...s.imageUrls, ''] });
  const removeUrl = (i: number) => set({ imageUrls: s.imageUrls.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Add at least 5 image URLs for your property (exterior, bedroom, bathroom, etc.).</p>
      {s.imageUrls.map((url, i) => (
        <div key={i} className="flex gap-2">
          <TextInput
            value={url}
            onChange={v => updateUrl(i, v)}
            placeholder={`Image ${i + 1} URL (https://...)`}
          />
          {s.imageUrls.length > 1 && (
            <button
              type="button"
              onClick={() => removeUrl(i)}
              className="shrink-0 text-red-400 hover:text-red-600 px-2 text-lg"
            >
              ×
            </button>
          )}
        </div>
      ))}
      {s.imageUrls.find(u => u.trim()) && (
        <img
          src={s.imageUrls.find(u => u.trim())}
          alt="preview"
          className="w-full h-40 object-cover rounded-xl border border-gray-200"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <button
        type="button"
        onClick={addUrl}
        className="text-sm text-[#003580] hover:underline font-medium"
      >
        + Add another image
      </button>
      <p className={`text-xs ${s.imageUrls.filter(u => u.trim()).length < 5 ? 'text-orange-500' : 'text-green-600'}`}>
        {s.imageUrls.filter(u => u.trim()).length} / 5 minimum images added
      </p>
    </div>
  );
}

function Step4({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-4">
      <FieldRow label="Base price per night (₹) *">
        <TextInput
          type="number"
          value={s.basePrice}
          onChange={v => set({ basePrice: v })}
          placeholder="e.g. 2500"
        />
      </FieldRow>
      <FieldRow label="Meal plan">
        <select
          value={s.mealPlan}
          onChange={e => set({ mealPlan: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#003580]"
        >
          <option value="NONE">Room only</option>
          <option value="BREAKFAST">Breakfast included</option>
        </select>
      </FieldRow>
      <FieldRow label="Cancellation policy">
        <div className="space-y-2">
          {[
            { value: 'FLEXIBLE', label: 'Flexible — cancel up to 1 day before check-in, full refund' },
            { value: 'NON_REFUNDABLE', label: 'Non-refundable — 10% discount, no refund' },
          ].map(p => (
            <label key={p.value} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-[#003580] transition-colors">
              <input
                type="radio"
                name="cancellationPolicy"
                value={p.value}
                checked={s.cancellationPolicy === p.value}
                onChange={() => set({ cancellationPolicy: p.value })}
                className="mt-0.5 accent-[#003580]"
              />
              <span className="text-sm text-gray-700">{p.label}</span>
            </label>
          ))}
        </div>
      </FieldRow>
    </div>
  );
}

function Step5({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">KYC information is captured for compliance. It will not be verified in the MVP.</p>
      <FieldRow label="Entity type">
        <div className="flex gap-4">
          {['INDIVIDUAL', 'BUSINESS'].map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="entityType"
                value={t}
                checked={s.entityType === t}
                onChange={() => set({ entityType: t })}
                className="accent-[#003580]"
              />
              <span className="text-sm text-gray-700">{t === 'INDIVIDUAL' ? 'Individual' : 'Business'}</span>
            </label>
          ))}
        </div>
      </FieldRow>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="First name">
          <TextInput value={s.legalFirstName} onChange={v => set({ legalFirstName: v })} placeholder="Legal first name" />
        </FieldRow>
        <FieldRow label="Last name">
          <TextInput value={s.legalLastName} onChange={v => set({ legalLastName: v })} placeholder="Legal last name" />
        </FieldRow>
      </div>
      <FieldRow label="PAN (10 characters)">
        <TextInput value={s.pan} onChange={v => set({ pan: v.toUpperCase() })} placeholder="ABCDE1234F" />
      </FieldRow>
      <FieldRow label="Contact phone">
        <TextInput type="tel" value={s.phone} onChange={v => set({ phone: v })} placeholder="+91 XXXXX XXXXX" />
      </FieldRow>
    </div>
  );
}

function Step6({ s }: { s: WizardState }) {
  const Section = ({ title, items }: { title: string; items: [string, string][] }) => (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{title}</h3>
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-gray-500">{k}</span>
            <span className="text-gray-800 font-medium text-right max-w-[60%] truncate">{v || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <Section title="Basic Info" items={[
        ['Name', s.name], ['Address', s.address], ['City', s.city],
        ['Category', s.category], ['Stars', String(s.starRating)],
      ]} />
      <Section title="Property Setup" items={[
        ['Amenities', s.amenities.join(', ') || 'None'],
        ['Booking mode', s.bookingMode],
        ['Description', s.description ? `${s.description.slice(0, 60)}…` : ''],
      ]} />
      <Section title="Pricing" items={[
        ['Base price', s.basePrice ? `₹${s.basePrice}/night` : ''],
        ['Meal plan', s.mealPlan],
        ['Cancellation', s.cancellationPolicy],
      ]} />
      <Section title="Legal" items={[
        ['Entity', s.entityType],
        ['Name', `${s.legalFirstName} ${s.legalLastName}`.trim()],
        ['PAN', s.pan], ['Phone', s.phone],
      ]} />
      <p className="text-xs text-gray-400">
        By clicking "Open for bookings" you agree to StayBook's Partner Terms & Conditions and acknowledge the 12% platform commission.
      </p>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function PartnerOnboardingPage() {
  const navigate  = useNavigate();
  const [step, setStep]   = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL);

  const set = (patch: Partial<WizardState>) => setState(s => ({ ...s, ...patch }));

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!state.name.trim()) return 'Property name is required';
      if (!state.address.trim()) return 'Address is required';
      if (!state.city.trim()) return 'City is required';
    }
    if (step === 2) {
      if (state.imageUrls.filter(u => u.trim()).length < 5) return 'Please add at least 5 image URLs';
    }
    if (step === 3) {
      if (!state.basePrice || Number(state.basePrice) <= 0) return 'Base price must be greater than 0';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const createMutation = useMutation({
    mutationFn: async (asDraft: boolean) => {
      const res: { data?: { id?: string } } = await propertiesApi.create({
        name:        state.name,
        address:     state.address,
        city:        state.city,
        postcode:    state.postcode,
        category:    state.category,
        starRating:  state.starRating,
        amenities:   state.amenities,
        description: state.description,
        bookingMode: state.bookingMode,
      });
      const pid = res.data?.id;
      if (!asDraft && pid) await propertiesApi.publish(pid);
    },
    onSuccess: () => {
      toast.success(createMutation.variables ? 'Saved as draft!' : 'Property is now live!');
      navigate('/partner/dashboard');
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const stepContent = [
    <Step1 s={state} set={set} />,
    <Step2 s={state} set={set} />,
    <Step3 s={state} set={set} />,
    <Step4 s={state} set={set} />,
    <Step5 s={state} set={set} />,
    <Step6 s={state} />,
  ];

  return (
    <PartnerLayout title="Add New Property">
      {/* Progress stepper */}
      <div className="flex items-center mb-8 overflow-x-auto pb-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center shrink-0">
            <div className={`flex items-center gap-2 ${i <= step ? 'cursor-pointer' : ''}`} onClick={() => i < step && setStep(i)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                i < step  ? 'bg-[#003580] border-[#003580] text-white' :
                i === step ? 'border-[#003580] text-[#003580] bg-white' :
                             'border-gray-200 text-gray-400 bg-white'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-[#003580]' : i < step ? 'text-gray-700' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${i < step ? 'bg-[#003580]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-800 mb-6">
          Step {step + 1}: {STEPS[step]}
        </h2>

        {stepContent[step]}

        {/* Nav buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={() => setStep(s => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:text-gray-300 transition-colors"
          >
            ← Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              className="px-6 py-2.5 bg-[#003580] text-white text-sm font-bold rounded-xl hover:bg-[#00224F] transition-colors"
            >
              Next →
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => createMutation.mutate(true)}
                disabled={createMutation.isPending}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:border-gray-400 transition-colors disabled:opacity-60"
              >
                Save as draft
              </button>
              <button
                onClick={() => createMutation.mutate(false)}
                disabled={createMutation.isPending}
                className="px-6 py-2.5 bg-[#FFCC00] text-gray-900 text-sm font-bold rounded-xl hover:bg-[#E6B800] transition-colors disabled:opacity-60"
              >
                {createMutation.isPending ? 'Publishing…' : 'Open for bookings →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </PartnerLayout>
  );
}
