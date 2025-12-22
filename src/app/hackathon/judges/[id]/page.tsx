import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle2, Calendar, MapPin, Award, Globe, Mail } from 'lucide-react';
import { PrintButton } from '@/components/print-button';

interface JudgeData {
  name: string;
  role: string;
  event: string;
  year: string;
  organization: string;
  location: string;
  verifiedDate: string;
  eventDate: string;
  website: string;
  contactEmail: string;
}

interface JudgeDatabase {
  [key: string]: JudgeData;
}

async function getJudgeData(id: string): Promise<JudgeData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/judges/verify.json`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data: JudgeDatabase = await response.json();
    return data[id] || null;
  } catch (error) {
    console.error('Error fetching judge data:', error);
    return null;
  }
}

export async function generateStaticParams() {
  // Pre-generate the known judge verification pages
  return [
    { id: 'NST-DEVFORGE-JUDGE-2025-001' },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const judge = await getJudgeData(id);
  
  if (!judge) {
    return {
      title: 'Judge Not Found - DevForge Hackathon',
      description: 'Judge verification page for DevForge Hackathon'
    };
  }

  return {
    title: `${judge.name} - Official Judge Verification | DevForge Hackathon ${judge.year}`,
    description: `Official verification page confirming ${judge.name} as a judge for ${judge.event} ${judge.year}, organized by ${judge.organization}. Digital verification ID: ${id}`,
    keywords: ['judge verification', 'DevForge', 'hackathon', 'Newton School of Technology', judge.name, 'official verification'],
    openGraph: {
      title: `${judge.name} - Official Judge | DevForge Hackathon`,
      description: `Verified judge for ${judge.event} ${judge.year}`,
      url: `https://hackathon.code4o4.xyz/hackathon/judges/${id}`,
      type: 'profile',
    }
  };
}

export default async function JudgeVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const judge = await getJudgeData(id);

  if (!judge) {
    notFound();
  }

  const verificationUrl = `https://hackathon.code4o4.xyz/hackathon/judges/${id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-12 px-4 print:bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-blue-900 print:shadow-none print:border">
          {/* Official Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Official Judge Verification</h1>
                <p className="text-blue-100 text-sm">{judge.organization}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <div className="text-xs text-blue-100 mb-1">Verification ID</div>
                <div className="font-mono font-bold text-sm">{id}</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8">
            {/* Verified Badge */}
            <div className="flex items-center justify-center mb-8">
              <div className="inline-flex items-center gap-3 bg-green-50 border-2 border-green-500 rounded-full px-6 py-3">
                <CheckCircle2 className="text-green-600" size={32} />
                <div>
                  <div className="text-green-900 font-bold text-lg">Officially Verified</div>
                  <div className="text-green-700 text-sm">Official Verification Statement</div>
                </div>
              </div>
            </div>

            {/* Judge Information */}
            <div className="space-y-6">
              <div className="text-center border-b border-neutral-200 pb-6">
                <h2 className="text-3xl font-bold text-neutral-900 mb-2">{judge.name}</h2>
                <div className="flex items-center justify-center gap-2 text-orange-600">
                  <Award size={20} />
                  <span className="text-xl font-semibold">{judge.role}</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-6 bg-neutral-50 rounded-xl p-6 print:bg-neutral-50">
                <div>
                  <div className="text-sm text-neutral-600 mb-1 font-medium">Event</div>
                  <div className="text-lg font-semibold text-neutral-900">{judge.event} {judge.year}</div>
                </div>

                <div>
                  <div className="text-sm text-neutral-600 mb-1 font-medium">Organizer</div>
                  <div className="text-lg font-semibold text-neutral-900">{judge.organization}</div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="text-neutral-500 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <div className="text-sm text-neutral-600 mb-1 font-medium">Location</div>
                    <div className="text-neutral-900">{judge.location}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="text-neutral-500 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <div className="text-sm text-neutral-600 mb-1 font-medium">Event Date</div>
                    <div className="text-neutral-900">{judge.eventDate}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Globe className="text-neutral-500 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <div className="text-sm text-neutral-600 mb-1 font-medium">Official Website</div>
                    <a 
                      href={judge.website}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-orange-600 hover:text-orange-700 underline break-all"
                    >
                      {judge.website}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Mail className="text-neutral-500 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <div className="text-sm text-neutral-600 mb-1 font-medium">Contact Email</div>
                    <a 
                      href={`mailto:${judge.contactEmail}`}
                      className="text-orange-600 hover:text-orange-700 underline break-all"
                    >
                      {judge.contactEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="border-t border-neutral-200 pt-6 print:hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900 mb-2">Digital Verification</h3>
                    <p className="text-sm text-neutral-600 mb-3">
                      Scan this QR code or visit the URL below to verify this document online at any time.
                    </p>
                    <div className="bg-white rounded-lg px-3 py-2 border border-neutral-300">
                      <code className="text-xs text-neutral-700 break-all">{verificationUrl}</code>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="bg-white p-4 rounded-xl border-2 border-neutral-300 shadow-lg">
                      <Image 
                        src={qrCodeUrl}
                        alt="Verification QR Code"
                        width={200}
                        height={200}
                        className="block"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="border-t border-neutral-200 pt-6 mt-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Verification Note:</strong> This page serves as official confirmation that {judge.name}{' '}
                    served as a judge for {judge.event} {judge.year}. This verification is issued by {judge.organization}{' '} 
                    and can be authenticated at any time using the unique verification ID: <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">{id}</code>
                  </p>
                </div>
              </div>

              {/* Issued Date */}
              <div className="text-center text-sm text-neutral-500 pt-4">
                <p>Date of Issuance: {judge.verifiedDate}</p>
                <p className="mt-2">© {judge.year} {judge.organization}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className="mt-6 text-center print:hidden">
          <PrintButton />
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-neutral-600 print:hidden">
          <p>For inquiries or verification assistance, please contact <a href={`mailto:${judge.contactEmail}`} className="text-orange-600 hover:underline">{judge.contactEmail}</a></p>
        </div>
      </div>
    </div>
  );
}
