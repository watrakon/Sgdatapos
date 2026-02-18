const API_URL = "https://sgdata-backend.onrender.com/api";

export interface Employee {
  id: string;
  nameTh: string;
  nameEn: string;
  nicknameTh: string;
  nicknameEn: string;
  position: string;
  phone: string;
  email: string;
  password?: string;
  role: 'EXECUTIVE' | 'HR' | 'EMPLOYEE';
}
export interface PackingList {
  customerBrand: string;
  project: string;
  deliveryDate: string;
  mainSet: {
    posTerminal: { model: string; qty: string };
    posLicense: { qty: string };
  };
  peripherals: {
    cashDrawer: boolean;
    receiptPrinter: boolean;
    barcodeScanner: boolean;
    customerDisplay: boolean;
  };
  digitalSignage: {
    screen: { size: string };
    powerAdapter: boolean;
    accessories: string;
  };
  cables: {
    powerCable: boolean;
    lanCable: boolean;
    usbCable: boolean;
    hdmiVga: boolean;
    adapterConverter: boolean;
    others: string;
  };
  specialRemarks: string;
  signatures: {
    orderer: string;
    orderDate: string;
    packer: string;
    packDate: string;
    deliverer: string;
    deliveryDate: string;
  };
}


export interface TimeRecord {
  id: string;
  email: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  status: 'NORMAL' | 'LATE' | 'NONE';
  timestamp: string;
  location: string;
  coords: { latitude: number; longitude: number } | null;
}

export interface Job {
  id: string;
  employeeId: string;
  date: string;
  customerName: string;
  activity: string;
  status: 
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED';

  remark: string;
  packingList?: any;   // ✅ เพิ่มบรรทัดนี้
}


export const EmployeeService = {


  // ---------------- EMPLOYEES ----------------

  async getAllEmployees(): Promise<Employee[]> {
    const res = await fetch(`${API_URL}/employees`);
    return await res.json();
  },

  async addEmployee(emp: Employee) {
    const res = await fetch(`${API_URL}/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emp)
    });
    return await res.json();
  },

  async updateEmployee(id: string, emp: Employee) {
    const res = await fetch(`${API_URL}/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emp)
    });
    return await res.json();
  },

  async deleteEmployee(id: string) {
    const res = await fetch(`${API_URL}/employees/${id}`, {
      method: "DELETE"
    });
    return await res.json();
  },

  // ---------------- AUTH ----------------

  async login(email: string, password: string): Promise<Employee | null> {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    

    if (!res.ok) return null;

    const data = await res.json();
    return data.employee;
  },

  async updatePassword(email: string, newPassword: string) {
    const res = await fetch(`${API_URL}/update-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword })
    });

    return await res.json();
  },
saveFieldServiceJob: async (currentUser: any, companions: string[], data: any) => {
  const job = {
    ...data,
    employeeId: currentUser.id,
    status: "IN_PROGRESS"
  };

  await EmployeeService.addEmployee(job); // หรือจะทำ endpoint job จริงภายหลังก็ได้
},

  // ---------------- SESSION ----------------

  setCurrentUser(user: Employee) {
    localStorage.setItem("CURRENT_USER", JSON.stringify(user));
  },

  getCurrentUser(): Employee | null {
    const saved = localStorage.getItem("CURRENT_USER");
    return saved ? JSON.parse(saved) : null;
  },

  logout() {
    localStorage.removeItem("CURRENT_USER");
  },

  // ---------------- TIME ATTENDANCE ----------------

  saveTimeRecord(record: TimeRecord) {
    const history = EmployeeService.getTimeHistory(record.email);
    history.unshift(record);
    localStorage.setItem(`HISTORY_${record.email}`, JSON.stringify(history));
  },

  getTimeHistory(email: string): TimeRecord[] {
    const saved = localStorage.getItem(`HISTORY_${email}`);
    return saved ? JSON.parse(saved) : [];
  },

  getTeamLocations(): { employee: Employee; record: TimeRecord }[] {
    const employeesRaw = localStorage.getItem("EMP_STORAGE");
    const employees: Employee[] = employeesRaw
  ? JSON.parse(employeesRaw)
  : [];

    return employees
      .map(emp => {
        const history = EmployeeService.getTimeHistory(emp.email);
        return { employee: emp, record: history[0] };
      })
      .filter(item => item.record !== undefined);
  },

  // ---------------- JOB ----------------

  getJobs(): Job[] {
    const saved = localStorage.getItem("SGDATA_JOBS");
    return saved ? JSON.parse(saved) : [];
  },

  saveJob(job: Job) {
    const jobs = EmployeeService.getJobs();
    const index = jobs.findIndex(j => j.id === job.id);

    if (index !== -1) jobs[index] = job;
    else jobs.push(job);

    localStorage.setItem("SGDATA_JOBS", JSON.stringify(jobs));
  },

  deleteJob(jobId: string) {
    let jobs = EmployeeService.getJobs();
    jobs = jobs.filter(j => j.id !== jobId);
    localStorage.setItem("SGDATA_JOBS", JSON.stringify(jobs));
  },

async getAssignments(employeeId: string): Promise<Job[]> {
  const jobs = EmployeeService.getJobs();
  return jobs.filter(j => j.employeeId === employeeId);
},
updateAssignmentStatus(id: string, status: 'ACCEPTED' | 'REJECTED') {
  const jobs = EmployeeService.getJobs();
  const index = jobs.findIndex(j => j.id === id);
  if (index !== -1) {
    jobs[index].status = status;
    localStorage.setItem("SGDATA_JOBS", JSON.stringify(jobs));
  }
},

// ---------------- LEAVE ----------------

getAllLeaveRequests() {
  const saved = localStorage.getItem("SGDATA_LEAVES");
  return saved ? JSON.parse(saved) : [];
},

saveLeaveRequest(request: any) {
  const leaves = EmployeeService.getAllLeaveRequests();
  leaves.push(request);
  localStorage.setItem("SGDATA_LEAVES", JSON.stringify(leaves));
},

updateLeaveStatus(id: string, status: string) {
  const leaves = EmployeeService.getAllLeaveRequests();
  const index = leaves.findIndex((l: any) => l.id === id);
  if (index !== -1) {
    leaves[index].status = status;
    localStorage.setItem("SGDATA_LEAVES", JSON.stringify(leaves));
  }
},

// ---------------- OT REQUESTS ----------------

getAllOTRequests() {
  const saved = localStorage.getItem("SGDATA_OT");
  return saved ? JSON.parse(saved) : [];
},

getOTRequests() {
  return EmployeeService.getAllOTRequests();
},

saveOTRequest(request: any) {
  const ots = EmployeeService.getOTRequests();
  ots.push(request);
  localStorage.setItem("SGDATA_OT", JSON.stringify(ots));
},

updateOTStatus(id: string, status: string) {
  const ots = EmployeeService.getOTRequests();
  const index = ots.findIndex((o: any) => o.id === id);

  if (index !== -1) {
    ots[index].status = status;
    localStorage.setItem("SGDATA_OT", JSON.stringify(ots));
  }
},



// ---------------- HOLIDAYS ----------------

getUploadedHolidays() {
  const saved = localStorage.getItem("SGDATA_HOLIDAYS");
  return saved ? JSON.parse(saved) : [];
},

saveHoliday(holiday: any) {
  const holidays = EmployeeService.getUploadedHolidays();
  holidays.push(holiday);
  localStorage.setItem("SGDATA_HOLIDAYS", JSON.stringify(holidays));
},

deleteHoliday(id: string) {
  let holidays = EmployeeService.getUploadedHolidays();
  holidays = holidays.filter((h: any) => h.id !== id);
  localStorage.setItem("SGDATA_HOLIDAYS", JSON.stringify(holidays));
},

// ---------------- LEAVE REQUESTS ----------------

getLeaveRequests() {
  const saved = localStorage.getItem("SGDATA_LEAVES");
  return saved ? JSON.parse(saved) : [];
},





  // ---------------- HELPERS ----------------

  saveCredentials(email: string, pass: string, remember: boolean) {
    if (remember)
      localStorage.setItem("REMEMBER_ME", JSON.stringify({ email, pass }));
    else
      localStorage.removeItem("REMEMBER_ME");
  },

  getSavedCredentials() {
    const saved = localStorage.getItem("REMEMBER_ME");
    return saved ? JSON.parse(saved) : null;
  }

};
