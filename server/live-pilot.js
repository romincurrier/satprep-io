import {createHash} from 'node:crypto';
import {service} from './supabase-server.js';

export const LIVE_PILOT_VERSION='live-pilot-v1';
const TOKEN=/^[A-Za-z0-9_-]{32,128}$/;

export function hashPilotToken(token){
 const value=String(token||'').trim();
 if(!TOKEN.test(value))throw Object.assign(new Error('Pilot invitation is invalid.'),{status:400});
 return createHash('sha256').update(value).digest('hex');
}

export async function pilotEnrollmentByToken(token){
 const hash=hashPilotToken(token);
 const rows=await service(`/rest/v1/pilot_enrollments?token_hash=eq.${hash}&select=id,label,status,expires_at,parent_profile_id,household_id,student_id,metadata,created_at,claimed_at,completed_at&limit=1`);
 return rows?.[0]||null;
}

export async function claimedPilotForHousehold(householdId){
 if(!householdId)return null;
 const rows=await service(`/rest/v1/pilot_enrollments?household_id=eq.${encodeURIComponent(householdId)}&status=eq.claimed&select=id,label,status,expires_at,parent_profile_id,household_id,student_id,metadata,created_at,claimed_at&order=claimed_at.desc&limit=1`);
 return rows?.[0]||null;
}

export function isLivePilotStudent(student,enrollment){
 return !!student?.is_test_student&&!!enrollment?.id&&String(student?.test_label||'')===`live-pilot:${enrollment.id}`;
}
