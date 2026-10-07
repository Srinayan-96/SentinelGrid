async function testE2E() {
  try {
    console.log("1. Creating SOS Incident...");
    const sosReq = await fetch('http://localhost:5000/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Building Collapse in Mumbai",
        description: "A 4-story building has collapsed. Several people trapped.",
        type: "RESCUE",
        people_affected: 15,
        lat: 19.0760,
        lng: 72.8777,
        state: "Maharashtra"
      })
    });
    const sosRes = await sosReq.json();
    if (!sosReq.ok) throw new Error(JSON.stringify(sosRes));
    
    console.log("SOS Created:", sosRes.id);
    console.log("AI Triage:", sosRes.ai_urgency, sosRes.ai_summary);

    const incidentId = sosRes.id;

    console.log("\n2. Logging in as Commander...");
    const cmdReq = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "command@rescue.in",
        password: "RESCUE2024"
      })
    });
    const cmdLogin = await cmdReq.json();
    if (!cmdReq.ok) throw new Error(JSON.stringify(cmdLogin));
    const cmdToken = cmdLogin.token;
    console.log("Commander Logged In.");

    console.log("\n3. Fetching Facilities to Assign...");
    const facReq = await fetch('http://localhost:5000/api/facilities');
    const facilities = await facReq.json();
    if (!facilities.length) throw new Error("No facilities found!");
    const facility = facilities[0];
    console.log("Selected Facility:", facility.name);

    console.log("\n4. Commander Assigning Incident...");
    const assignReq = await fetch(`http://localhost:5000/api/incidents/${incidentId}/assign`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cmdToken}` 
      },
      body: JSON.stringify({
        facilityId: facility.id,
        assignedUnit: facility.name
      })
    });
    const assignRes = await assignReq.json();
    if (!assignReq.ok) throw new Error(JSON.stringify(assignRes));
    console.log("Assigned! New Status:", assignRes.status);
    console.log("Lat/Lng Present in Enriched Data?", "lat:", assignRes.lat, "lng:", assignRes.lng);

    console.log("\n5. Logging in as Responder (ndrf1)...");
    const respReq = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "ndrf1@rescue.in",
        password: "RESCUE2024"
      })
    });
    const respLogin = await respReq.json();
    if (!respReq.ok) throw new Error(JSON.stringify(respLogin));
    const respToken = respLogin.token;
    console.log("Responder Logged In.");

    console.log("\n6. Responder Updating Status (EN_ROUTE)...");
    const statusReq = await fetch(`http://localhost:5000/api/incidents/${incidentId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${respToken}` 
      },
      body: JSON.stringify({
        status: 'EN_ROUTE'
      })
    });
    const statusRes = await statusReq.json();
    if (!statusReq.ok) throw new Error(JSON.stringify(statusRes));
    console.log("Status Updated:", statusRes.status);

    console.log("\n7. Responder Resolving Mission...");
    const resolveReq = await fetch(`http://localhost:5000/api/incidents/${incidentId}/resolve`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${respToken}` 
      },
      body: JSON.stringify({
        people_saved: 14,
        resources_used: ['Ambulance', 'Rescue Team'],
        notes: "14 rescued safely. 1 missing."
      })
    });
    const resolveRes = await resolveReq.json();
    if (!resolveReq.ok) throw new Error(JSON.stringify(resolveRes));
    console.log("Mission Resolved! Status:", resolveRes.status);

    console.log("\nAll E2E Tests Passed Successfully! ✅");
  } catch (err) {
    console.error("Test Failed:", err.message);
  }
}

testE2E();
