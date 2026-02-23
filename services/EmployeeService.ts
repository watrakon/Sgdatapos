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

export interface AssignedTask {
  id: string;
  assignerId: string;
  employeeId: string;
  date: string;
  time: string;
  customerName: string;
  activity: string;
  remark: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  timestamp: string;
}


export interface EasyPassActivity {
  id: string;
  type: 'TOPUP' | 'PAYMENT';
  location: string;
  category: string;
  amount: number;
  timestamp: string;
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

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'SICK' | 'BUSINESS' | 'VACATION';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: string;

  coordinatorId?: string;
  coordinatorStatus?: 
    | 'PENDING' 
    | 'APPROVED' 
    | 'REJECTED'
    | 'ACCEPTED';   // ✅ เพิ่มบรรทัดนี้
}

export interface OTRequest {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: string;   // ✅ เพิ่ม
}

export const EmployeeService = {



getDailySessions() {
  const saved = localStorage.getItem("SGDATA_SESSIONS");
  return saved ? JSON.parse(saved) : [];
},


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

  
updateAssignmentStatus(
  id: string,
  status: 'ACCEPTED' | 'REJECTED'
) {
  const jobs = this.getJobs();   // ดึงงานทั้งหมด
  const index = jobs.findIndex((j: any) => j.id === id);

  if (index !== -1) {
    jobs[index].status = status;
    localStorage.setItem("SGDATA_JOBS", JSON.stringify(jobs));
  }
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

  // ---------------- ASSIGNMENTS ----------------

getAssignments(employeeId: string): AssignedTask[] {
  const saved = localStorage.getItem("SGDATA_ASSIGNMENTS");
  const list: AssignedTask[] = saved ? JSON.parse(saved) : [];
  return list.filter(a => a.employeeId === employeeId);
},

saveAssignment(task: AssignedTask) {
  const saved = localStorage.getItem("SGDATA_ASSIGNMENTS");
  const list: AssignedTask[] = saved ? JSON.parse(saved) : [];

  list.push(task);
  localStorage.setItem("SGDATA_ASSIGNMENTS", JSON.stringify(list));
},

deleteAssignment(id: string) {
  const saved = localStorage.getItem("SGDATA_ASSIGNMENTS");
  let list: AssignedTask[] = saved ? JSON.parse(saved) : [];

  list = list.filter(a => a.id !== id);
  localStorage.setItem("SGDATA_ASSIGNMENTS", JSON.stringify(list));
},

async saveEmployee(emp: Employee): Promise<boolean> {
  try {
    if (!emp.id) return false;

    // ถ้ามี id อยู่แล้ว = update
    const existing = await this.getAllEmployees();
    const found = existing.find(e => e.id === emp.id);

    if (found) {
      await this.updateEmployee(emp.id, emp);
    } else {
      await this.addEmployee(emp);
    }

    return true;
  } catch (err) {
    console.error("saveEmployee error:", err);
    return false;
  }
},


// ---------------- EASY PASS ----------------

getEasyPassActivities(): EasyPassActivity[] {
  const saved = localStorage.getItem("SGDATA_EASYPASS");
  return saved ? JSON.parse(saved) : [];
},

saveEasyPassActivity(activity: EasyPassActivity) {
  const list = EmployeeService.getEasyPassActivities();
  list.push(activity);
  localStorage.setItem("SGDATA_EASYPASS", JSON.stringify(list));
},

// ---------------- LEAVE ----------------

getAllLeaveRequests(): LeaveRequest[] {
  const saved = localStorage.getItem("SGDATA_LEAVES");
  return saved ? JSON.parse(saved) : [];
},

saveLeaveRequest(request: LeaveRequest) {
  const leaves = EmployeeService.getAllLeaveRequests();
  leaves.push(request);
  localStorage.setItem("SGDATA_LEAVES", JSON.stringify(leaves));
},

updateLeaveStatus(
  id: string,
  status: LeaveRequest['status']
) {
  const leaves = EmployeeService.getAllLeaveRequests();
  const index = leaves.findIndex(l => l.id === id);

  if (index !== -1) {
    leaves[index].status = status;
    localStorage.setItem("SGDATA_LEAVES", JSON.stringify(leaves));
  }
},

// ---------------- OT REQUESTS ----------------

getAllOTRequests(): OTRequest[] {
  const saved = localStorage.getItem("SGDATA_OT");
  return saved ? JSON.parse(saved) : [];
},  

getOTRequests(employeeId: string): OTRequest[] {
  const all = this.getAllOTRequests();
  return all.filter(o => o.employeeId === employeeId);
},

saveOTRequest(request: OTRequest) {
  const ots = this.getAllOTRequests();
  ots.push(request);
  localStorage.setItem("SGDATA_OT", JSON.stringify(ots));
},

updateOTStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  const ots = this.getAllOTRequests();
  const index = ots.findIndex(o => o.id === id);

  if (index !== -1) {
    ots[index].status = status;
    localStorage.setItem("SGDATA_OT", JSON.stringify(ots));
  }
},



// ---------------- HOLIDAYS ----------------

getUploadedHolidays(): any[] {
  const saved = localStorage.getItem("SGDATA_HOLIDAYS");
  return saved ? JSON.parse(saved) : [];
},

saveUploadedHolidays(holidays: any[]) {
  localStorage.setItem("SGDATA_HOLIDAYS", JSON.stringify(holidays));
},

clearUploadedHolidays() {
  localStorage.removeItem("SGDATA_HOLIDAYS");
},

// ---------------- LEAVE REQUESTS ----------------

getLeaveRequests(employeeId: string): LeaveRequest[] {
  const saved = localStorage.getItem("SGDATA_LEAVES");
  const list: LeaveRequest[] = saved ? JSON.parse(saved) : [];
  return list.filter(l => l.employeeId === employeeId);
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

};   // ← ปิด object