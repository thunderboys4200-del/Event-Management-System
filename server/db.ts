import mongoose, { Schema, Document, Model } from 'mongoose';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { config } from './config';

// ----------------------------------------------------
// TypeScript Interfaces
// ----------------------------------------------------
export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  loginId: string;
  password?: string;
  role: 'student' | 'staff';
  department: string;
  year?: string;
  mobileNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IEvent {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  department: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  registrationDeadline: string;
  posterUrl: string;
  photoUrls: string[];
  videoUrls?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IRegistration {
  _id?: string;
  id?: string;
  student: string; // User ID or populated object
  event: string;   // Event ID or populated object
  registeredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ----------------------------------------------------
// Mongoose Schemas
// ----------------------------------------------------
const UserSchema = new Schema({
  name: { type: String, required: true },
  loginId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'staff'], required: true },
  department: { type: String, required: true },
  year: { type: String },
  mobileNumber: { type: String },
}, { timestamps: true });

const EventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  registrationDeadline: { type: String, required: true },
  posterUrl: { type: String, default: '' },
  photoUrls: { type: [String], default: [] },
  videoUrls: { type: [String], default: [] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const RegistrationSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound unique constraint to prevent duplicate registrations
RegistrationSchema.index({ student: 1, event: 1 }, { unique: true });

let MongooseUserModel: Model<any>;
let MongooseEventModel: Model<any>;
let MongooseRegistrationModel: Model<any>;

try {
  MongooseUserModel = mongoose.model('User', UserSchema);
  MongooseEventModel = mongoose.model('Event', EventSchema);
  MongooseRegistrationModel = mongoose.model('Registration', RegistrationSchema);
} catch {
  MongooseUserModel = mongoose.model('User');
  MongooseEventModel = mongoose.model('Event');
  MongooseRegistrationModel = mongoose.model('Registration');
}

// ----------------------------------------------------
// File-Backed Embedded Store for Seamless Execution
// ----------------------------------------------------
interface DBState {
  users: IUser[];
  events: IEvent[];
  registrations: IRegistration[];
}

const DB_FILE = path.join(config.dataDir, 'db.json');

function ensureDirectories() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
  if (!fs.existsSync(config.uploadsDir)) {
    fs.mkdirSync(config.uploadsDir, { recursive: true });
  }
}

function readLocalDB(): DBState {
  ensureDirectories();
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading local db.json, reinitializing', err);
    }
  }
  return { users: [], events: [], registrations: [] };
}

function writeLocalDB(state: DBState) {
  ensureDirectories();
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

let isMongoConnected = false;

export async function connectDB() {
  if (config.mongoUri) {
    try {
      console.log('Connecting to MongoDB Atlas at', config.mongoUri.replace(/:[^:@]+@/, ':***@'));
      await mongoose.connect(config.mongoUri);
      isMongoConnected = true;
      console.log('Successfully connected to MongoDB Atlas');
      await seedMongoDatabase();
      return;
    } catch (err) {
      console.warn('MongoDB Atlas connection failed or unavailable. Falling back to local persistent store.', (err as Error).message);
    }
  } else {
    console.log('No MONGODB_URI provided in environment. Running with local persistent database.');
  }

  ensureDirectories();
  initLocalDBSeed();
}

export function isUsingMongoDB() {
  return isMongoConnected;
}

// ----------------------------------------------------
// Database Adapter providing unified CRUD operations
// ----------------------------------------------------
export const db = {
  async findUserByLoginId(loginId: string): Promise<IUser | null> {
    if (isMongoConnected) {
      const u = await MongooseUserModel.findOne({ loginId });
      if (!u) return null;
      return {
        _id: u._id.toString(),
        id: u._id.toString(),
        name: u.name,
        loginId: u.loginId,
        password: u.password,
        role: u.role,
        department: u.department,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      };
    }
    const state = readLocalDB();
    const user = state.users.find(u => u.loginId.toUpperCase() === loginId.trim().toUpperCase());
    return user ? { ...user, id: user._id } : null;
  },

  async findUserById(id: string): Promise<IUser | null> {
    if (isMongoConnected) {
      const u = await MongooseUserModel.findById(id);
      if (!u) return null;
      return {
        _id: u._id.toString(),
        id: u._id.toString(),
        name: u.name,
        loginId: u.loginId,
        password: u.password,
        role: u.role,
        department: u.department,
      };
    }
    const state = readLocalDB();
    const user = state.users.find(u => u._id === id || u.id === id);
    return user ? { ...user, id: user._id } : null;
  },

  async findOrCreateStudentUser(studentData: { name: string; department: string; year: string; mobileNumber: string }): Promise<IUser> {
    const cleanPhone = studentData.mobileNumber.replace(/\D/g, '');
    const loginId = cleanPhone.length >= 4
      ? `STU_${cleanPhone.slice(-6)}`
      : `STU_${studentData.name.replace(/\s+/g, '').toUpperCase().slice(0, 4)}_${Date.now().toString().slice(-4)}`;

    if (isMongoConnected) {
      let u = await MongooseUserModel.findOne({ loginId });
      if (!u) {
        u = await MongooseUserModel.findOne({ name: studentData.name, role: 'student' });
      }
      if (u) {
        u.department = studentData.department;
        await u.save();
        return {
          _id: u._id.toString(),
          id: u._id.toString(),
          name: u.name,
          loginId: u.loginId,
          role: u.role,
          department: u.department,
          year: studentData.year,
          mobileNumber: studentData.mobileNumber,
        };
      }
      const newDoc = await MongooseUserModel.create({
        name: studentData.name,
        loginId,
        password: bcrypt.hashSync(loginId + '@123', 10),
        role: 'student',
        department: studentData.department,
      });
      return {
        _id: newDoc._id.toString(),
        id: newDoc._id.toString(),
        name: newDoc.name,
        loginId: newDoc.loginId,
        role: newDoc.role,
        department: newDoc.department,
        year: studentData.year,
        mobileNumber: studentData.mobileNumber,
      };
    }

    const state = readLocalDB();
    let existing = state.users.find(
      u => u.loginId === loginId || (u.name.toLowerCase() === studentData.name.toLowerCase() && u.role === 'student')
    );
    if (existing) {
      existing.department = studentData.department;
      existing.name = studentData.name;
      existing.year = studentData.year;
      existing.mobileNumber = studentData.mobileNumber;
      writeLocalDB(state);
      return { ...existing, id: existing._id };
    }

    const newId = 'usr_stu_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newUser: IUser = {
      _id: newId,
      id: newId,
      name: studentData.name,
      loginId,
      password: bcrypt.hashSync('Student@123', 10),
      role: 'student',
      department: studentData.department,
      year: studentData.year,
      mobileNumber: studentData.mobileNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.users.push(newUser);
    writeLocalDB(state);
    return newUser;
  },

  async findUserByMobile(mobileNumber: string): Promise<IUser | null> {
    const clean = mobileNumber.replace(/\D/g, '');
    if (isMongoConnected) {
      const u = await MongooseUserModel.findOne({
        $or: [
          { mobileNumber: mobileNumber.trim() },
          ...(clean.length >= 6 ? [{ mobileNumber: clean }] : [])
        ]
      });
      if (!u) return null;
      return {
        _id: u._id.toString(),
        id: u._id.toString(),
        name: u.name,
        loginId: u.loginId,
        password: u.password,
        role: u.role,
        department: u.department,
        year: u.year,
        mobileNumber: u.mobileNumber,
      };
    }
    const state = readLocalDB();
    const user = state.users.find(u => {
      if (!u.mobileNumber) return false;
      const uClean = u.mobileNumber.replace(/\D/g, '');
      return u.mobileNumber.trim() === mobileNumber.trim() || (clean.length >= 6 && uClean === clean);
    });
    return user ? { ...user, id: user._id } : null;
  },

  async registerStudentUser(data: {
    name: string;
    department: string;
    year: string;
    mobileNumber: string;
    loginId: string;
    password: string;
  }): Promise<IUser> {
    const trimmedLoginId = data.loginId.trim();
    const trimmedMobile = data.mobileNumber.trim();

    // Check unique Student ID
    const existingById = await this.findUserByLoginId(trimmedLoginId);
    if (existingById) {
      const error: any = new Error('Student ID already exists. Please choose another Student ID.');
      error.statusCode = 409;
      error.field = 'loginId';
      throw error;
    }

    // Check unique mobile number
    const existingByMobile = await this.findUserByMobile(trimmedMobile);
    if (existingByMobile) {
      const error: any = new Error('This mobile number is already registered. Please use a different mobile number or login with your existing Student ID.');
      error.statusCode = 409;
      error.field = 'mobileNumber';
      throw error;
    }

    // Hash password with bcrypt
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(data.password, salt);

    if (isMongoConnected) {
      const newDoc = await MongooseUserModel.create({
        name: data.name.trim(),
        loginId: trimmedLoginId,
        password: hashedPassword,
        role: 'student',
        department: data.department.trim(),
        year: data.year.trim(),
        mobileNumber: trimmedMobile,
      });
      return {
        _id: newDoc._id.toString(),
        id: newDoc._id.toString(),
        name: newDoc.name,
        loginId: newDoc.loginId,
        role: newDoc.role,
        department: newDoc.department,
        year: newDoc.year,
        mobileNumber: newDoc.mobileNumber,
        createdAt: newDoc.createdAt,
        updatedAt: newDoc.updatedAt,
      };
    }

    const state = readLocalDB();
    const newId = 'usr_stu_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    const newUser: IUser = {
      _id: newId,
      id: newId,
      name: data.name.trim(),
      loginId: trimmedLoginId,
      password: hashedPassword,
      role: 'student',
      department: data.department.trim(),
      year: data.year.trim(),
      mobileNumber: trimmedMobile,
      createdAt: now,
      updatedAt: now,
    };
    state.users.push(newUser);
    writeLocalDB(state);
    return newUser;
  },

  async getAllEvents(): Promise<IEvent[]> {
    if (isMongoConnected) {
      const docs = await MongooseEventModel.find().sort({ date: 1 });
      return docs.map(d => ({
        _id: d._id.toString(),
        id: d._id.toString(),
        title: d.title,
        description: d.description,
        department: d.department,
        category: d.category,
        date: d.date,
        time: d.time,
        venue: d.venue,
        registrationDeadline: d.registrationDeadline,
        posterUrl: d.posterUrl,
        photoUrls: d.photoUrls || [],
        videoUrls: d.videoUrls || [],
        createdBy: d.createdBy?.toString(),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));
    }
    const state = readLocalDB();
    return state.events.map(e => ({ ...e, id: e._id }));
  },

  async getEventById(id: string): Promise<IEvent | null> {
    if (isMongoConnected) {
      const d = await MongooseEventModel.findById(id);
      if (!d) return null;
      return {
        _id: d._id.toString(),
        id: d._id.toString(),
        title: d.title,
        description: d.description,
        department: d.department,
        category: d.category,
        date: d.date,
        time: d.time,
        venue: d.venue,
        registrationDeadline: d.registrationDeadline,
        posterUrl: d.posterUrl,
        photoUrls: d.photoUrls || [],
        videoUrls: d.videoUrls || [],
        createdBy: d.createdBy?.toString(),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    }
    const state = readLocalDB();
    const ev = state.events.find(e => e._id === id || e.id === id);
    return ev ? { ...ev, id: ev._id } : null;
  },

  async createEvent(eventData: Omit<IEvent, '_id' | 'id'>): Promise<IEvent> {
    if (isMongoConnected) {
      const doc = await MongooseEventModel.create(eventData);
      return {
        _id: doc._id.toString(),
        id: doc._id.toString(),
        title: doc.title,
        description: doc.description,
        department: doc.department,
        category: doc.category,
        date: doc.date,
        time: doc.time,
        venue: doc.venue,
        registrationDeadline: doc.registrationDeadline,
        posterUrl: doc.posterUrl,
        photoUrls: doc.photoUrls || [],
        videoUrls: doc.videoUrls || [],
        createdBy: doc.createdBy?.toString(),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    }
    const state = readLocalDB();
    const newId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const newEvent: IEvent = {
      ...eventData,
      _id: newId,
      id: newId,
      photoUrls: eventData.photoUrls || [],
      videoUrls: eventData.videoUrls || [],
      createdAt: now,
      updatedAt: now,
    };
    state.events.push(newEvent);
    writeLocalDB(state);
    return newEvent;
  },

  async updateEvent(id: string, updateData: Partial<IEvent>): Promise<IEvent | null> {
    if (isMongoConnected) {
      const doc = await MongooseEventModel.findByIdAndUpdate(id, updateData, { new: true });
      if (!doc) return null;
      return {
        _id: doc._id.toString(),
        id: doc._id.toString(),
        title: doc.title,
        description: doc.description,
        department: doc.department,
        category: doc.category,
        date: doc.date,
        time: doc.time,
        venue: doc.venue,
        registrationDeadline: doc.registrationDeadline,
        posterUrl: doc.posterUrl,
        photoUrls: doc.photoUrls || [],
        videoUrls: doc.videoUrls || [],
        createdBy: doc.createdBy?.toString(),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    }
    const state = readLocalDB();
    const idx = state.events.findIndex(e => e._id === id || e.id === id);
    if (idx === -1) return null;
    const current = state.events[idx];
    const updated: IEvent = {
      ...current,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    state.events[idx] = updated;
    writeLocalDB(state);
    return updated;
  },

  async deleteEvent(id: string): Promise<boolean> {
    if (isMongoConnected) {
      const res = await MongooseEventModel.findByIdAndDelete(id);
      if (res) {
        await MongooseRegistrationModel.deleteMany({ event: id });
        return true;
      }
      return false;
    }
    const state = readLocalDB();
    const idx = state.events.findIndex(e => e._id === id || e.id === id);
    if (idx === -1) return false;
    state.events.splice(idx, 1);
    // Cascade delete registrations
    state.registrations = state.registrations.filter(r => r.event !== id);
    writeLocalDB(state);
    return true;
  },

  async createRegistration(studentId: string, eventId: string): Promise<IRegistration> {
    if (isMongoConnected) {
      // Check duplicate
      const existing = await MongooseRegistrationModel.findOne({ student: studentId, event: eventId });
      if (existing) {
        throw new Error('Already registered for this event');
      }
      const reg = await MongooseRegistrationModel.create({
        student: studentId,
        event: eventId,
        registeredAt: new Date(),
      });
      return {
        _id: reg._id.toString(),
        id: reg._id.toString(),
        student: studentId,
        event: eventId,
        registeredAt: reg.registeredAt.toISOString(),
      };
    }
    const state = readLocalDB();
    const existing = state.registrations.find(
      r => (r.student === studentId) && (r.event === eventId)
    );
    if (existing) {
      throw new Error('Already registered for this event');
    }
    const newId = 'reg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newReg: IRegistration = {
      _id: newId,
      id: newId,
      student: studentId,
      event: eventId,
      registeredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.registrations.push(newReg);
    writeLocalDB(state);
    return newReg;
  },

  async isStudentRegistered(studentId: string, eventId: string): Promise<boolean> {
    if (isMongoConnected) {
      const count = await MongooseRegistrationModel.countDocuments({ student: studentId, event: eventId });
      return count > 0;
    }
    const state = readLocalDB();
    return state.registrations.some(r => r.student === studentId && r.event === eventId);
  },

  async getStudentRegistrations(studentId: string): Promise<any[]> {
    if (isMongoConnected) {
      const regs = await MongooseRegistrationModel.find({ student: studentId })
        .populate('event')
        .sort({ createdAt: -1 });
      return regs.map(r => ({
        _id: r._id.toString(),
        id: r._id.toString(),
        registeredAt: r.registeredAt,
        event: r.event ? {
          _id: (r.event as any)._id.toString(),
          id: (r.event as any)._id.toString(),
          title: (r.event as any).title,
          description: (r.event as any).description,
          department: (r.event as any).department,
          category: (r.event as any).category,
          date: (r.event as any).date,
          time: (r.event as any).time,
          venue: (r.event as any).venue,
          registrationDeadline: (r.event as any).registrationDeadline,
          posterUrl: (r.event as any).posterUrl,
        } : null
      })).filter(r => r.event !== null);
    }
    const state = readLocalDB();
    const regs = state.registrations.filter(r => r.student === studentId);
    return regs.map(r => {
      const event = state.events.find(e => e._id === r.event || e.id === r.event);
      return {
        _id: r._id,
        id: r._id,
        registeredAt: r.registeredAt,
        event: event ? { ...event, id: event._id } : null,
      };
    }).filter(r => r.event !== null);
  },

  async getEventRegistrations(eventId: string): Promise<any[]> {
    if (isMongoConnected) {
      const regs = await MongooseRegistrationModel.find({ event: eventId })
        .populate('student', '-password')
        .sort({ createdAt: -1 });
      return regs.map(r => ({
        _id: r._id.toString(),
        id: r._id.toString(),
        registeredAt: r.registeredAt,
        student: r.student ? {
          _id: (r.student as any)._id.toString(),
          id: (r.student as any)._id.toString(),
          name: (r.student as any).name,
          loginId: (r.student as any).loginId,
          department: (r.student as any).department,
          role: (r.student as any).role,
          year: (r.student as any).year,
          mobileNumber: (r.student as any).mobileNumber,
        } : null
      })).filter(r => r.student !== null);
    }
    const state = readLocalDB();
    const regs = state.registrations.filter(r => r.event === eventId);
    return regs.map(r => {
      const user = state.users.find(u => u._id === r.student || u.id === r.student);
      return {
        _id: r._id,
        id: r._id,
        registeredAt: r.registeredAt,
        student: user ? {
          _id: user._id,
          id: user._id,
          name: user.name,
          loginId: user.loginId,
          department: user.department,
          role: user.role,
          year: user.year,
          mobileNumber: user.mobileNumber,
        } : null,
      };
    }).filter(r => r.student !== null);
  },

  async getRegistrationCountForEvent(eventId: string): Promise<number> {
    if (isMongoConnected) {
      return await MongooseRegistrationModel.countDocuments({ event: eventId });
    }
    const state = readLocalDB();
    return state.registrations.filter(r => r.event === eventId).length;
  },

  async getOverallStats(userId?: string, role?: string) {
    const today = new Date().toISOString().split('T')[0];
    const events = await this.getAllEvents();
    const upcomingEvents = events.filter(e => e.date >= today);
    const pastEvents = events.filter(e => e.date < today);

    if (role === 'student' && userId) {
      const myRegs = await this.getStudentRegistrations(userId);
      return {
        upcomingEventsCount: upcomingEvents.length,
        myRegistrationsCount: myRegs.length,
        pastEventsCount: pastEvents.length,
        totalEventsCount: events.length,
      };
    }

    // Staff or general stats
    let totalRegistrations = 0;
    if (isMongoConnected) {
      totalRegistrations = await MongooseRegistrationModel.countDocuments();
    } else {
      const state = readLocalDB();
      totalRegistrations = state.registrations.length;
    }

    return {
      totalEvents: events.length,
      upcomingEvents: upcomingEvents.length,
      pastEvents: pastEvents.length,
      totalRegistrations,
    };
  }
};

// ----------------------------------------------------
// Initial Seed Data with Verified Password Hashes
// ----------------------------------------------------
export function getInitialSeedData() {
  // Bcrypt hash of 'Student@123'
  const studentSalt = bcrypt.genSaltSync(10);
  const studentHash = bcrypt.hashSync('Student@123', studentSalt);

  // Bcrypt hash of 'Staff@123'
  const staffSalt = bcrypt.genSaltSync(10);
  const staffHash = bcrypt.hashSync('Staff@123', staffSalt);

  const initialUsers: IUser[] = [
    {
      _id: 'usr_student_01',
      id: 'usr_student_01',
      name: 'Alex Rivera',
      loginId: 'STU001',
      password: studentHash,
      role: 'student',
      department: 'Computer Science & Engineering',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'usr_staff_01',
      id: 'usr_staff_01',
      name: 'Mr. Loki',
      loginId: 'STF001',
      password: staffHash,
      role: 'staff',
      department: 'Student Affairs & Campus Activities',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Realistic college event photos & posters from reliable Unsplash education/campus photography
  const initialEvents: IEvent[] = [
    {
      _id: 'evt_upcoming_01',
      id: 'evt_upcoming_01',
      title: 'InnovateX: National College Hackathon 2026',
      description: 'Join over 400 passionate student developers, designers, and innovators for a 36-hour non-stop collegiate hackathon. Build next-generation solutions in Artificial Intelligence, CleanTech, and Web3 with mentorship from top industry engineers, hardware lab access, and $15,000 in prizes.',
      department: 'Computer Science & Engineering',
      category: 'Technical',
      date: '2026-10-15',
      time: '09:00 AM',
      venue: 'University Tech Innovation Hub, Hall 4',
      registrationDeadline: '2026-10-10',
      posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      photoUrls: [
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
      ],
      createdBy: 'usr_staff_01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'evt_upcoming_02',
      id: 'evt_upcoming_02',
      title: 'Vibrance 2026: Annual Inter-College Cultural Gala',
      description: 'The pinnacle celebration of college arts, music, theatre, and dance! Featuring battle of the bands, classical & contemporary dance competitions, fashion runway, comedy night, and food stalls from across the country. Open to all departments.',
      department: 'Fine Arts & Student Council',
      category: 'Cultural',
      date: '2026-11-05',
      time: '04:30 PM',
      venue: 'Grand Open Air Amphitheatre',
      registrationDeadline: '2026-11-01',
      posterUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      photoUrls: [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80'
      ],
      createdBy: 'usr_staff_01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'evt_upcoming_03',
      id: 'evt_upcoming_03',
      title: 'RoboQuest: Autonomous Robotics & Drone Challenge',
      description: 'Design, build, and deploy autonomous rovers through complex obstacle courses, line-following arenas, and precision aerial drone navigation. All engineering disciplines welcome. Workshop kit provided upon registration.',
      department: 'Mechanical & Robotics Engineering',
      category: 'Technical',
      date: '2026-11-20',
      time: '10:00 AM',
      venue: 'Robotics Central Arena, Block C',
      registrationDeadline: '2026-11-14',
      posterUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
      photoUrls: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1200&q=80'
      ],
      createdBy: 'usr_staff_01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'evt_upcoming_04',
      id: 'evt_upcoming_04',
      title: 'Future of AI & Ethics: International Colloquium',
      description: 'A distinguished symposium featuring leading researchers from academia and industry examining generative models, safety alignment, bias mitigation, and human-in-the-loop AI systems. Includes panel discussions and student poster presentations.',
      department: 'Artificial Intelligence & Data Science',
      category: 'Seminar',
      date: '2026-12-02',
      time: '02:00 PM',
      venue: 'Dr. APJ Abdul Kalam Memorial Auditorium',
      registrationDeadline: '2026-11-28',
      posterUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      photoUrls: [
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80'
      ],
      createdBy: 'usr_staff_01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Past Events with rich photo galleries
    {
      _id: 'evt_past_01',
      id: 'evt_past_01',
      title: 'Collegiate Champions Trophy: Annual Athletic Meet 2025',
      description: 'The premier athletic meet of the year showcasing track and field events, sprint relays, high jump, tug-of-war, and volleyball tournaments across all collegiate houses with record-breaking attendance and spirited sportsmanship.',
      department: 'Physical Education & Athletics',
      category: 'Sports',
      date: '2025-11-18',
      time: '08:30 AM',
      venue: 'University Olympic Sports Ground',
      registrationDeadline: '2025-11-10',
      posterUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
      photoUrls: [
        'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'
      ],
      createdBy: 'usr_staff_01',
      createdAt: '2025-11-01T08:00:00.000Z',
      updatedAt: '2025-11-20T18:00:00.000Z',
    },
    {
      _id: 'evt_past_02',
      id: 'evt_past_02',
      title: 'TEDx College: Uncharted Horizons & Ideas Worth Spreading',
      description: 'An inspirational evening featuring 8 keynote speakers from space sciences, social entrepreneurship, biomedical robotics, and youth leadership, igniting powerful dialogue among our student community.',
      department: 'Humanities & Social Sciences',
      category: 'Seminar',
      date: '2025-10-12',
      time: '03:00 PM',
      venue: 'Main Academic Concourse',
      registrationDeadline: '2025-10-08',
      posterUrl: 'https://images.unsplash.com/photo-1544531585-9847b68c8c86?auto=format&fit=crop&w=1200&q=80',
      photoUrls: [
        'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80'
      ],
      createdBy: 'usr_staff_01',
      createdAt: '2025-09-25T10:00:00.000Z',
      updatedAt: '2025-10-14T20:00:00.000Z',
    },
    {
      _id: 'evt_past_03',
      id: 'evt_past_03',
      title: 'CodeSprint 2025: Inter-Collegiate Algorithmic Derby',
      description: 'Speed-coding and algorithmic contest with over 60 collegiate teams battling through dynamic programming, graph traversal, and mathematical puzzles. Congratulations to the winning team from CSE Year 3!',
      department: 'Computer Science & Engineering',
      category: 'Technical',
      date: '2025-08-28',
      time: '11:00 AM',
      venue: 'Alan Turing Computing Centre',
      registrationDeadline: '2025-08-25',
      posterUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80',
      photoUrls: [
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
      ],
      createdBy: 'usr_staff_01',
      createdAt: '2025-08-10T09:00:00.000Z',
      updatedAt: '2025-08-30T16:00:00.000Z',
    }
  ];

  const initialRegistrations: IRegistration[] = [
    {
      _id: 'reg_demo_01',
      id: 'reg_demo_01',
      student: 'usr_student_01',
      event: 'evt_upcoming_01',
      registeredAt: '2026-09-01T14:30:00.000Z',
      createdAt: '2026-09-01T14:30:00.000Z',
      updatedAt: '2026-09-01T14:30:00.000Z',
    }
  ];

  return { initialUsers, initialEvents, initialRegistrations };
}

function initLocalDBSeed() {
  const state = readLocalDB();
  if (!state.users || state.users.length === 0) {
    const { initialUsers, initialEvents, initialRegistrations } = getInitialSeedData();
    writeLocalDB({
      users: initialUsers,
      events: initialEvents,
      registrations: initialRegistrations,
    });
    console.log('Seeded local database with development users (STU001, STF001) and realistic college events.');
  }
}

async function seedMongoDatabase() {
  const count = await MongooseUserModel.countDocuments();
  if (count === 0) {
    const { initialUsers, initialEvents, initialRegistrations } = getInitialSeedData();
    const createdUsers = await MongooseUserModel.insertMany(initialUsers.map(u => ({
      name: u.name,
      loginId: u.loginId,
      password: u.password,
      role: u.role,
      department: u.department,
    })));

    const staffUser = createdUsers.find(u => u.role === 'staff') || createdUsers[0];
    const studentUser = createdUsers.find(u => u.role === 'student') || createdUsers[0];

    const createdEvents = await MongooseEventModel.insertMany(initialEvents.map(e => ({
      title: e.title,
      description: e.description,
      department: e.department,
      category: e.category,
      date: e.date,
      time: e.time,
      venue: e.venue,
      registrationDeadline: e.registrationDeadline,
      posterUrl: e.posterUrl,
      photoUrls: e.photoUrls,
      createdBy: staffUser._id,
    })));

    if (createdEvents.length > 0 && studentUser) {
      await MongooseRegistrationModel.create({
        student: studentUser._id,
        event: createdEvents[0]._id,
        registeredAt: new Date(),
      });
    }
    console.log('Successfully seeded MongoDB Atlas collections with development users & events.');
  }
}
