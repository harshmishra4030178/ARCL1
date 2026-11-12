'use client';

import React, { useState } from 'react';

export default function CompanyGstForm({ onAutoFill, initialData = {}, className = '' }) {
  const [formData, setFormData] = useState({
    gstin: initialData.gstin || '',
    legalName: initialData.legalName || '',
    tradeName: initialData.tradeName || '',
    pan: initialData.pan || '',
    state: initialData.state || '',
    pincode: initialData.pincode || '',
    addr: initialData.addr || initialData.address || ''
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Input change handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Main Auto-Fetch Function
  const handleFetchGst = async () => {
    const cleanGst = (formData.gstin || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanGst || cleanGst.length !== 15) {
      alert('Please enter a valid 15-digit GSTIN!');
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      // Backend URL (Agar Express 5000 par chal raha hai ya proxy set hai)
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      let res;
      try {
        res = await fetch('/api/gst/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gstin: cleanGst })
        });
        if (!res.ok && res.status === 404) {
          throw new Error('Fallback to direct backend');
        }
      } catch (_) {
        res = await fetch(`${BACKEND_URL}/api/gst/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gstin: cleanGst })
        });
      }

      const data = await res.json();
      setLoading(false);
      if (data.success) {
        const payload = data.data || data;
        const resolvedLegalName = data.legalName || payload.legalName || '';
        const resolvedTradeName = data.tradeName || payload.tradeName || resolvedLegalName;
        const resolvedPan = data.pan || payload.pan || cleanGst.substring(2, 12);
        const resolvedState = data.state || payload.state || '';
        const resolvedPincode = data.pincode || payload.pincode || '';
        const resolvedAddr = data.addr || payload.addr || payload.address?.line1 || '';

        // Auto-fill all states
        const nextState = {
          gstin: cleanGst,
          legalName: resolvedLegalName || formData.legalName,
          tradeName: resolvedTradeName || resolvedLegalName || formData.tradeName,
          pan: resolvedPan || formData.pan,
          state: resolvedState || formData.state,
          pincode: resolvedPincode || formData.pincode,
          addr: resolvedAddr || formData.addr
        };
        setFormData(nextState);

        const statusDisplay = data.status || payload.status || 'Active';
        setStatusMsg({
          type: 'success',
          text: `✓ Verified: ${resolvedLegalName || resolvedTradeName} (${statusDisplay})`
        });

        if (typeof onAutoFill === 'function') {
          onAutoFill({
            ...data,
            ...nextState
          });
        }
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'GST details nahi mil payi.' });
      }
    } catch (err) {
      setLoading(false);
      setStatusMsg({ type: 'error', text: 'Server se connect nahi ho paya: ' + err.message });
    }
  };

  return (
    <div className={`max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-4 border border-slate-200 ${className}`}>
      <h2 className="text-xl font-bold text-slate-800">Company & GST Details</h2>
      {/* GSTIN Input with Embedded Button */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          GSTIN <span className="text-red-500">*</span>
        </label>
        <div className="flex rounded-lg border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <input
            type="text"
            name="gstin"
            value={formData.gstin}
            onChange={handleChange}
            placeholder="e.g. 27ABDCA3876F1ZL"
            maxLength={15}
            className="flex-1 px-3 py-2 text-xs uppercase font-mono tracking-wider text-slate-800 outline-none"
          />
          <button
            type="button"
            onClick={handleFetchGst}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">⏳</span>
                <span>Fetching...</span>
              </>
            ) : (
              <span>Fetch Details</span>
            )}
          </button>
        </div>
      </div>
      {/* Status Feedback Message */}
      {statusMsg && (
        <div
          className={`p-2.5 rounded-lg text-xs font-medium ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {statusMsg.text}
        </div>
      )}
      {/* Auto-filled Target Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Company Legal Name</label>
          <input
            type="text"
            name="legalName"
            value={formData.legalName}
            onChange={handleChange}
            placeholder="Auto-filled Legal Name"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Brand / Trade Name</label>
          <input
            type="text"
            name="tradeName"
            value={formData.tradeName}
            onChange={handleChange}
            placeholder="Auto-filled Brand Name"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Company PAN</label>
          <input
            type="text"
            name="pan"
            value={formData.pan}
            onChange={handleChange}
            placeholder="Auto-filled PAN"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">State</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="Auto-filled State"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="6-digit Pincode"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">Registered Address</label>
          <textarea
            name="addr"
            rows="3"
            value={formData.addr}
            onChange={handleChange}
            placeholder="Complete address will be auto-filled here..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
          ></textarea>
        </div>
      </div>
    </div>
  );
}
