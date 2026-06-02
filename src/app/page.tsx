"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Check, Ticket, Users, Home, Gift, UserPlus, ShoppingBag, 
  ArrowRight, AlertCircle, Phone, Store, User, MapPin, X, 
  Camera, QrCode, History, LogOut, Menu, Share2, ArrowLeft, 
  ChevronLeft, Copy, UserCheck, Trash2, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ----------------------------------------------------------------------
// Mock Data & Constants
// ----------------------------------------------------------------------
const STORE_NAMES = [
  "카페 일상", "맛나 식당", "청춘 분식", "알파 문구", "마카롱 팩토리",
  "고기창고", "스터디카페", "홍콩반점", "파스타 바", "샐러드볼",
  "동네포차", "라멘집", "베이커리", "편의점", "꽃집",
  "버거타운", "아이스크림", "명랑핫도그", "대학서점", "김밥천국",
  "초밥집", "피자하우스", "치킨나라", "와플대학", "로스터리"
];

// Shuffle helper
const shuffleArray = (array: string[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Check bingo logic
const checkBingos = (stamped: boolean[]) => {
  const lines = [
    [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Horizontal
    [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Vertical
    [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonal
  ];
  let count = 0;
  for (const line of lines) {
    if (line.every(index => stamped[index])) count++;
  }
  return count;
};

// ----------------------------------------------------------------------
// Main Application Component
// ----------------------------------------------------------------------
export default function BingMoneyApp() {
  // Navigation & Modal State
  const [view, setView] = useState<"login" | "signup" | "app">("login");
  const [loginRole, setLoginRole] = useState<"student" | "merchant">("student");
  const [activeTab, setActiveTab] = useState<string>("bingo"); // student: bingo | scan | coupons, merchant: scan | history
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [studentSubView, setStudentSubView] = useState<"main" | "friends">("main");
  
  // Toast States
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");

  // Form States
  const [userForm, setUserForm] = useState({ name: "", phone: "", birth: "" });
  const [merchantForm, setMerchantForm] = useState({ id: "", password: "" });
  const [newFriendPhone, setNewFriendPhone] = useState("");
  const [newFriendName, setNewFriendName] = useState("");

  // Logged-in Session State
  const [user, setUser] = useState<{ name: string; phone: string; birth: string; role: "student" | "merchant" } | null>(null);

  // App Business States
  const [board, setBoard] = useState<{ id: number; name: string; stamped: boolean }[]>([]);
  const [bingoCount, setBingoCount] = useState(0);
  const [coupons, setCoupons] = useState<{ id: string; title: string; used: boolean; date: string }[]>([]);
  const [friends, setFriends] = useState<{ id: string; name: string; phone: string; bingoCount: number }[]>([]);
  const [selectedCouponForQR, setSelectedCouponForQR] = useState<{ id: string; title: string; used: boolean } | null>(null);

  // Merchant scan logs
  const [merchantLogs, setMerchantLogs] = useState<{ id: string; title: string; time: string; date: string }[]>([]);

  // Camera & Scan States
  const [scanning, setScanning] = useState(false);
  const [scannerResult, setScannerResult] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(true);

  // Reset camera enabled status on tab/view changes
  useEffect(() => {
    setCameraEnabled(true);
  }, [activeTab, view]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Toast helper
  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // Sync wrappers
  const updateBoard = (newBoard: typeof board) => {
    setBoard(newBoard);
    localStorage.setItem("bingmoney_board", JSON.stringify(newBoard));
  };

  const updateCoupons = (newCoupons: typeof coupons) => {
    setCoupons(newCoupons);
    localStorage.setItem("bingmoney_coupons", JSON.stringify(newCoupons));
  };

  const updateBingoCount = (count: number) => {
    setBingoCount(count);
    localStorage.setItem("bingmoney_bingoCount", count.toString());
  };

  const updateFriends = (newFriends: typeof friends) => {
    setFriends(newFriends);
    localStorage.setItem("bingmoney_friends", JSON.stringify(newFriends));
  };

  const updateMerchantLogs = (newLogs: typeof merchantLogs) => {
    setMerchantLogs(newLogs);
    localStorage.setItem("bingmoney_merchant_logs", JSON.stringify(newLogs));
  };

  // Load state from LocalStorage on mount
  useEffect(() => {
    // 1. Auto-login check
    const savedUser = localStorage.getItem("bingmoney_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setView("app");
      if (parsedUser.role === "merchant") {
        setActiveTab("scan"); // Zero-click coupon scan screen for merchants
      } else {
        setActiveTab("bingo");
      }
    }

    // 2. Board state
    const savedBoard = localStorage.getItem("bingmoney_board");
    if (savedBoard) {
      setBoard(JSON.parse(savedBoard));
    } else {
      const shuffled = shuffleArray(STORE_NAMES);
      const initialBoard = shuffled.map((name, idx) => ({ id: idx, name, stamped: false }));
      setBoard(initialBoard);
      localStorage.setItem("bingmoney_board", JSON.stringify(initialBoard));
    }

    // 3. Coupons state
    const savedCoupons = localStorage.getItem("bingmoney_coupons");
    if (savedCoupons) {
      setCoupons(JSON.parse(savedCoupons));
    } else {
      const initialCoupons = [
        { id: "c1", title: "[가입축하] 상권 전용 1,000원 할인권", used: false, date: "방금 전" }
      ];
      setCoupons(initialCoupons);
      localStorage.setItem("bingmoney_coupons", JSON.stringify(initialCoupons));
    }

    // 4. Bingo Count
    const savedBingoCount = localStorage.getItem("bingmoney_bingoCount");
    if (savedBingoCount) {
      setBingoCount(parseInt(savedBingoCount, 10));
    }

    // 5. Merchant scan logs
    const savedLogs = localStorage.getItem("bingmoney_merchant_logs");
    if (savedLogs) {
      setMerchantLogs(JSON.parse(savedLogs));
    }

    // 6. Friends state
    const savedFriends = localStorage.getItem("bingmoney_friends");
    if (savedFriends) {
      setFriends(JSON.parse(savedFriends));
    } else {
      const initialFriends = [
        { id: "f1", name: "김민수", phone: "010-1234-5678", bingoCount: 2 },
        { id: "f2", name: "이지은", phone: "010-9876-5432", bingoCount: 1 }
      ];
      setFriends(initialFriends);
      localStorage.setItem("bingmoney_friends", JSON.stringify(initialFriends));
    }
  }, []);

  // Listen for storage changes across tabs for live sync testing
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bingmoney_coupons" && e.newValue) {
        const parsedCoupons = JSON.parse(e.newValue);
        setCoupons(parsedCoupons);

        if (selectedCouponForQR) {
          const matching = parsedCoupons.find((c: any) => c.id === selectedCouponForQR.id);
          if (matching && matching.used) {
            setSelectedCouponForQR({ ...selectedCouponForQR, used: true });
            showToast("쿠폰 사용이 승인되었습니다!", "success");
            setTimeout(() => {
              setSelectedCouponForQR(null);
            }, 2000);
          }
        }
      }
      if (e.key === "bingmoney_board" && e.newValue) {
        setBoard(JSON.parse(e.newValue));
      }
      if (e.key === "bingmoney_bingoCount" && e.newValue) {
        setBingoCount(parseInt(e.newValue, 10));
      }
      if (e.key === "bingmoney_merchant_logs" && e.newValue) {
        setMerchantLogs(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [selectedCouponForQR]);

  // Load jsQR script dynamically when in app view and scan tab active
  useEffect(() => {
    if (view !== "app" || activeTab !== "scan") return;
    
    const scriptId = "jsqr-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [view, activeTab]);

  // Camera access controller for scanner
  useEffect(() => {
    if (view !== "app" || activeTab !== "scan" || !cameraEnabled) {
      setScanning(false);
      return;
    }

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError("");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        
        let attempts = 0;
        const checkAndAttach = () => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true");
            videoRef.current.play().catch(e => console.warn("Video play failed:", e));
            setScanning(true);
          } else if (attempts < 15) {
            attempts++;
            setTimeout(checkAndAttach, 100);
          } else {
            console.error("Video element not found after multiple attempts");
            setScanning(false);
          }
        };

        checkAndAttach();
      } catch (err: any) {
        console.error("Camera access error:", err);
        setCameraError("카메라를 시작할 수 없습니다. 권한을 확인해주세요.");
        setScanning(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setScanning(false);
    };
  }, [view, activeTab, cameraEnabled]);

  // QR Scanning loop
  useEffect(() => {
    if (!scanning || view !== "app" || activeTab !== "scan") return;

    let animationFrameId: number;

    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const jsQR = (window as any).jsQR;
          if (jsQR) {
            const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (decoded && decoded.data) {
              handleScannedData(decoded.data);
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(scan);
    };

    animationFrameId = requestAnimationFrame(scan);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [scanning, view, activeTab, board, coupons, bingoCount, merchantLogs]);

  // Audio Success Beep
  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio Context failed:", e);
    }
  };

  // Handle scanned QR Code (Unified)
  const handleScannedData = (data: string) => {
    if (scannerResult) return; // Wait until current overlay dismisses

    if (user?.role === "student") {
      // --- Student Scans Store QR ---
      if (data.startsWith("bingmoney-store-")) {
        const storeName = data.replace("bingmoney-store-", "");
        const cellIndex = board.findIndex(cell => cell.name === storeName);
        
        if (cellIndex !== -1) {
          const cell = board[cellIndex];
          if (!cell.stamped) {
            playBeepSound();
            
            // 1. Update board stamp
            const newBoard = board.map(c => c.id === cell.id ? { ...c, stamped: true } : c);
            updateBoard(newBoard);
            
            // 2. Check and update bingo
            const newBingoCount = checkBingos(newBoard.map(c => c.stamped));
            
            setScannerResult({
              status: "success",
              message: `[도장 적립] '${storeName}' 스탬프를 획득했습니다!`
            });

            // 3. Update bingo line counts and award coupons if applicable
            if (newBingoCount > bingoCount) {
              updateBingoCount(newBingoCount);
              if (newBingoCount >= 3 && bingoCount < 3) {
                // Award 3-bingo coupon
                const newCoupons = [
                  { id: Date.now().toString(), title: `[3빙고 달성] 상권 3,000원 할인권`, used: false, date: "방금 전" },
                  ...coupons
                ];
                updateCoupons(newCoupons);
                showToast("축하합니다! 3빙고 달성으로 3,000원 할인 쿠폰이 발급되었습니다.", "success");
              } else {
                showToast(`빙고 완성! 현재 ${newBingoCount}빙고입니다.`, "success");
              }
            } else {
              showToast(`'${storeName}' 도장 적립 완료!`, "success");
            }

            // 4. Auto-redirect to [빙고판] tab after 2.5 seconds
            setTimeout(() => {
              setScannerResult(null);
              setActiveTab("bingo"); // Auto transition to board view
            }, 2500);

          } else {
            setScannerResult({
              status: "error",
              message: `이미 도장을 찍은 가게입니다: ${storeName}`
            });
            setTimeout(() => setScannerResult(null), 2500);
          }
        } else {
          setScannerResult({
            status: "error",
            message: "내 빙고판에서 해당 상점을 찾을 수 없습니다."
          });
          setTimeout(() => setScannerResult(null), 2500);
        }
      }
    } else if (user?.role === "merchant") {
      // --- Merchant Scans Coupon QR ---
      if (data.startsWith("bingmoney-coupon-")) {
        const couponId = data.replace("bingmoney-coupon-", "");
        
        // Fetch fresh copy to avoid local storage drift
        const savedCoupons = localStorage.getItem("bingmoney_coupons");
        if (savedCoupons) {
          const parsedCoupons = JSON.parse(savedCoupons);
          const couponIndex = parsedCoupons.findIndex((c: any) => c.id === couponId);
          
          if (couponIndex !== -1) {
            const coupon = parsedCoupons[couponIndex];
            if (!coupon.used) {
              parsedCoupons[couponIndex].used = true;
              localStorage.setItem("bingmoney_coupons", JSON.stringify(parsedCoupons));
              setCoupons(parsedCoupons);

              playBeepSound();
              setScannerResult({
                status: "success",
                message: `[인증 완료] ${coupon.title}`
              });

              // Log scanning history
              const timeStr = new Date().toLocaleTimeString("ko-KR", { 
                hour: "2-digit", 
                minute: "2-digit", 
                second: "2-digit" 
              });
              const dateStr = new Date().toLocaleDateString("ko-KR");
              
              const newLog = { 
                id: Date.now().toString(), 
                title: coupon.title, 
                time: timeStr, 
                date: dateStr
              };
              const updatedLogs = [newLog, ...merchantLogs].slice(0, 30);
              updateMerchantLogs(updatedLogs);

              setTimeout(() => setScannerResult(null), 2500);
            } else {
              setScannerResult({
                status: "error",
                message: "이미 사용 처리 완료된 쿠폰입니다."
              });
              setTimeout(() => setScannerResult(null), 2500);
            }
          } else {
            setScannerResult({
              status: "error",
              message: "유효하지 않은 쿠폰입니다. (코드 없음)"
            });
            setTimeout(() => setScannerResult(null), 2500);
          }
        }
      }
    }
  };

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginRole === "merchant") {
      // Merchant Login
      if (merchantForm.id === "admin" && merchantForm.password === "1234") {
        const merchantUser = { 
          name: "부대통령뚝배기 (대학로점)", 
          phone: "010-9999-1234", 
          birth: "", 
          role: "merchant" as const 
        };
        setUser(merchantUser);
        localStorage.setItem("bingmoney_user", JSON.stringify(merchantUser));
        setView("app");
        setActiveTab("scan"); // Zero-click camera activation
        showToast("가맹점(부대통령뚝배기) 모드로 로그인했습니다.", "success");
      } else {
        showToast("아이디 또는 비밀번호가 잘못되었습니다.", "error");
      }
    } else {
      // Student Login
      if (!userForm.phone) {
        showToast("전화번호를 입력해주세요.", "error");
        return;
      }
      const studentUser = { 
        name: userForm.name || "홍길동", 
        phone: userForm.phone, 
        birth: userForm.birth || "20010101", 
        role: "student" as const 
      };
      setUser(studentUser);
      localStorage.setItem("bingmoney_user", JSON.stringify(studentUser));
      setView("app");
      setActiveTab("bingo");
      showToast(`${studentUser.name} 학생님, 환영합니다!`, "success");
    }
  };

  // Signup handler
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.phone || !userForm.birth) {
      showToast("모든 회원 정보를 입력해주세요.", "error");
      return;
    }
    const studentUser = { 
      name: userForm.name, 
      phone: userForm.phone, 
      birth: userForm.birth, 
      role: "student" as const 
    };
    setUser(studentUser);
    localStorage.setItem("bingmoney_user", JSON.stringify(studentUser));
    setView("app");
    setActiveTab("bingo");
    showToast("가입 및 환영 1,000원 쿠폰 지급 완료!", "success");
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("bingmoney_user");
    setView("login");
    setActiveTab("bingo");
    setDrawerOpen(false);
    setStudentSubView("main");
    setScanning(false);
    showToast("안전하게 로그아웃되었습니다.", "info");
  };

  // Mock Purchase (Simulate shop purchase for manual testing)
  const handleMockPurchase = () => {
    const unstamped = board.filter(cell => !cell.stamped);
    if (unstamped.length === 0) {
      showToast("이미 모든 스탬프를 완성하셨습니다!", "info");
      return;
    }

    // Pick random store
    const target = unstamped[Math.floor(Math.random() * unstamped.length)];
    handleScannedData(`bingmoney-store-${target.name}`);
  };

  // Add friend logic
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendPhone.trim()) {
      showToast("친구의 전화번호를 입력해주세요.", "error");
      return;
    }
    const name = newFriendName.trim() || "새로운 친구";
    const newFriend = { 
      id: Date.now().toString(), 
      name, 
      phone: newFriendPhone, 
      bingoCount: Math.floor(Math.random() * 3) 
    };
    const updatedFriends = [...friends, newFriend];
    updateFriends(updatedFriends);
    setNewFriendPhone("");
    setNewFriendName("");
    showToast(`${name} 친구가 등록되었습니다.`, "success");
  };

  // Export Scanned Coupons History (Clipboard Copy)
  const handleExportLogs = () => {
    if (merchantLogs.length === 0) {
      showToast("내보낼 쿠폰 인식 내역이 없습니다.", "error");
      return;
    }

    const titleLine = `[BINGOMONEY] 가맹점 쿠폰 인식 내역 (${user?.name || "부대통령뚝배기"})\n`;
    const dateLine = `추출 일시: ${new Date().toLocaleString("ko-KR")}\n`;
    const headerLine = `----------------------------------------\n`;
    const bodyLines = merchantLogs.map((log, idx) => 
      `${idx + 1}. [${log.date} ${log.time}] ${log.title} - 정산대기`
    ).join("\n");
    const footerLine = `\n----------------------------------------\n총 ${merchantLogs.length}건이 집계되었습니다.`;

    const fullExportText = titleLine + dateLine + headerLine + bodyLines + footerLine;

    navigator.clipboard.writeText(fullExportText)
      .then(() => {
        showToast("인식 내역이 클립보드에 복사되었습니다! 외부 공유가 가능합니다.", "success");
      })
      .catch((err) => {
        console.error("Clipboard copy failed:", err);
        showToast("클립보드 복사에 실패했습니다. 권한을 확인해주세요.", "error");
      });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center p-4 font-sans text-slate-900">
      
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[400px] h-[800px] max-h-screen bg-slate-50 rounded-[40px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col border-[8px] border-slate-950">
        
        {/* Notch / Speaker bar styling for physical layout look */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-12 h-1.5 bg-slate-800 rounded-full" />
        </div>

        {/* Global Toast */}
        {toastMessage && (
          <div className="absolute top-10 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-6 duration-300">
            <div className={`px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center justify-between border ${
              toastType === "success" 
                ? "bg-emerald-500 border-emerald-400 text-white" 
                : toastType === "error" 
                ? "bg-rose-500 border-rose-400 text-white" 
                : "bg-slate-800 border-slate-700 text-slate-100"
            }`}>
              <div className="flex items-center gap-2">
                {toastType === "success" && <Check size={14} className="stroke-[3]" />}
                {toastType === "error" && <AlertCircle size={14} />}
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage("")} className="hover:opacity-75 transition-opacity">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* --- SIDEBAR DRAWER MENU --- */}
        {view === "app" && (
          <>
            {/* Drawer Backdrop */}
            <div 
              className={`absolute inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity duration-300 ${
                drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
              onClick={() => setDrawerOpen(false)}
            />

            {/* Sliding Drawer Container */}
            <div 
              className={`absolute top-0 right-0 h-full w-[280px] z-50 shadow-2xl flex flex-col p-6 transition-transform duration-300 ease-out ${
                user?.role === "merchant" 
                  ? "bg-slate-950 text-slate-100 border-l border-slate-800" 
                  : "bg-white text-slate-800 border-l border-slate-100"
              } ${
                drawerOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* Drawer Close Button */}
              <div className="flex justify-between items-center mb-6 mt-4">
                <span className="font-bold text-xs tracking-wider opacity-60">
                  {user?.role === "student" ? "STUDENT MENU" : "MERCHANT MENU"}
                </span>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className={`p-1.5 rounded-full transition-colors ${
                    user?.role === "merchant" ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Profile Summary */}
              <div className={`p-4 rounded-2xl mb-6 ${
                user?.role === "merchant" ? "bg-slate-900 border border-slate-800" : "bg-indigo-50/50 border border-indigo-100/50"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                    user?.role === "merchant" ? "bg-emerald-500 text-slate-950" : "bg-indigo-600 text-white"
                  }`}>
                    {user?.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate">{user?.name}</p>
                    <p className="text-[10px] opacity-60 truncate">{user?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Items in Drawer */}
              <div className="space-y-2 flex-1">
                {user?.role === "student" && (
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setStudentSubView("friends");
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-100 transition-colors text-left text-sm font-semibold group"
                  >
                    <div className="flex items-center gap-3 text-slate-700">
                      <Users size={18} className="text-indigo-600" />
                      <span>친구 목록 및 추가</span>
                    </div>
                    <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                {user?.role === "merchant" && (
                  <div className="p-3 text-xs opacity-60 text-center border border-dashed border-slate-800 rounded-xl">
                    가맹점 관리 메뉴 준비중
                  </div>
                )}
              </div>

              {/* Logout Button Isolated at Bottom */}
              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/80">
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className={`w-full justify-center gap-2 border-rose-500/20 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold py-5 rounded-xl ${
                    user?.role === "merchant" ? "bg-slate-950 border-slate-800 hover:bg-rose-950/20" : "bg-white"
                  }`}
                >
                  <LogOut size={14} />
                  로그아웃
                </Button>
              </div>
            </div>
          </>
        )}

        {/* --- VIEW: LOGIN --- */}
        {view === "login" && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white pt-12">
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              
              {/* Brand Logo & Intro */}
              <div className="text-center space-y-3">
                <div className="bg-indigo-600 w-16 h-16 rounded-[22px] flex items-center justify-center mx-auto mb-4 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.5)] animate-pulse">
                  <MapPin size={30} className="text-white" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight leading-none">BINGOMONEY</h1>
                <p className="text-slate-500 text-xs font-medium">대학 상권 활성화를 위한 빙고 리워드</p>
              </div>

              {/* Selector Tabs for Login Role */}
              <div className="w-full flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setLoginRole("student")}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 ${
                    loginRole === "student"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  학생 로그인
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole("merchant")}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 ${
                    loginRole === "merchant"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  가맹점 로그인
                </button>
              </div>

              <Card className="w-full border-none shadow-none bg-transparent">
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4 px-0 pb-4">
                    {loginRole === "student" ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="phone" className="text-xs font-bold text-slate-700">전화번호</Label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                            <Input
                              id="phone"
                              placeholder="010-0000-0000"
                              className="pl-10 py-5 bg-slate-50/50 border-slate-200 rounded-xl text-sm"
                              value={userForm.phone}
                              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center">
                          최초 접속 시 전화번호 기반으로 자동 스탬프와 연동됩니다.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="merchant-id" className="text-xs font-bold text-slate-700">관리자 아이디</Label>
                          <Input
                            id="merchant-id"
                            placeholder="admin"
                            className="bg-slate-50/50 border-slate-200 rounded-xl py-5 text-sm"
                            value={merchantForm.id}
                            onChange={(e) => setMerchantForm({ ...merchantForm, id: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="merchant-pw" className="text-xs font-bold text-slate-700">비밀번호</Label>
                          <Input
                            id="merchant-pw"
                            type="password"
                            placeholder="1234"
                            className="bg-slate-50/50 border-slate-200 rounded-xl py-5 text-sm"
                            value={merchantForm.password}
                            onChange={(e) => setMerchantForm({ ...merchantForm, password: e.target.value })}
                          />
                        </div>
                        <Alert className="bg-indigo-50 border-indigo-100 text-indigo-800 p-3 rounded-xl">
                          <div className="flex gap-2 items-center">
                            <AlertCircle size={14} className="text-indigo-600" />
                            <p className="text-[10px] font-semibold leading-none">
                              테스트용 ID: <strong className="text-indigo-700">admin</strong> / PW: <strong className="text-indigo-700">1234</strong>
                            </p>
                          </div>
                        </Alert>
                      </div>
                    )}
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-6 rounded-xl shadow-md transition-all">
                      로그인 완료
                    </Button>
                  </CardContent>
                </form>
                
                {loginRole === "student" && (
                  <CardFooter className="px-0 flex justify-center pt-0">
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setUserForm({ name: "", phone: "", birth: "" });
                        setView("signup");
                      }} 
                      className="text-indigo-600 text-xs font-semibold"
                    >
                      처음이신가요? 3초 간편 회원가입
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* --- VIEW: SIGNUP --- */}
        {view === "signup" && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white pt-10">
            <div className="mb-4">
              <Button variant="ghost" size="icon" onClick={() => setView("login")} className="-ml-2 hover:bg-slate-100 rounded-full">
                <ChevronLeft className="h-6 w-6 text-slate-800" />
              </Button>
            </div>
            <h2 className="text-2xl font-extrabold mb-1 tracking-tight text-slate-900">간편 회원가입</h2>
            <p className="text-slate-500 text-xs font-medium mb-6">스탬프 적립을 위해 학생 정보를 등록합니다.</p>

            <form onSubmit={handleSignup} className="space-y-5 flex-1 flex flex-col">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="signup-name" className="text-xs font-bold text-slate-700">이름</Label>
                  <Input
                    id="signup-name"
                    placeholder="홍길동"
                    className="bg-slate-50/50 border-slate-200 rounded-xl py-5 text-sm"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="signup-phone" className="text-xs font-bold text-slate-700">전화번호</Label>
                  <Input
                    id="signup-phone"
                    placeholder="010-0000-0000"
                    className="bg-slate-50/50 border-slate-200 rounded-xl py-5 text-sm"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-400">결제 및 가게 단말기 번호 입력시 이 번호로 매칭됩니다.</p>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="signup-birth" className="text-xs font-bold text-slate-700">생년월일</Label>
                  <Input
                    id="signup-birth"
                    placeholder="YYYYMMDD (예: 20010505)"
                    className="bg-slate-50/50 border-slate-200 rounded-xl py-5 text-sm"
                    value={userForm.birth}
                    onChange={(e) => setUserForm({ ...userForm, birth: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-auto pt-6">
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-sm font-bold text-white rounded-xl shadow-md">
                  동의하고 회원가입 완료
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* --- VIEW: MAIN APP (STUDENT ROLE) --- */}
        {view === "app" && user?.role === "student" && (
          <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
            
            {/* Header */}
            <header className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 pt-8">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-xl shadow-sm">
                  <MapPin size={15} className="text-white" />
                </div>
                <h1 className="font-extrabold text-md tracking-tight text-slate-900">BINGOMONEY</h1>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setDrawerOpen(true)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center p-0"
              >
                <Menu size={20} className="text-slate-700" />
              </Button>
            </header>

            {/* MAIN VIEWS */}
            <main className="flex-1 overflow-y-auto pb-20">
              
              {/* BINGO BOARD TAB */}
              {activeTab === "bingo" && (
                <div className="p-5 space-y-5">
                  {/* Action Mock Card */}
                  <Card className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 border-none text-white shadow-lg rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-bold flex items-center gap-2">
                        <ShoppingBag size={16} />
                        대학가 맛집을 털어보자!
                      </CardTitle>
                      <CardDescription className="text-indigo-100 text-xs">
                        가게에서 결제하면 스탬프가 찍힙니다. 시뮬레이터를 통해 스탬프를 적립해보세요.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleMockPurchase}
                        className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-extrabold text-xs py-4 rounded-xl shadow-sm transition-all"
                      >
                        무작위 결제 스탬프 시뮬레이션
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Bingo Header & Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">내 대학 상권 빙고판</h2>
                      <p className="text-[10px] text-slate-400 font-medium">5x5 빙고판을 채우고 보상을 받으세요.</p>
                    </div>
                    <Badge className="bg-indigo-600 text-white border-none py-1.5 px-3 rounded-full text-[10px] font-bold">
                      {bingoCount} 빙고 달성
                    </Badge>
                  </div>

                  {/* 5x5 Bingo Grid */}
                  <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                    <div className="grid grid-cols-5 gap-1.5">
                      {board.map((cell) => (
                        <div
                          key={cell.id}
                          className={`
                            relative aspect-square rounded-xl flex flex-col items-center justify-center p-1 text-center transition-all duration-300
                            ${cell.stamped
                              ? 'bg-indigo-50 border-2 border-indigo-500 shadow-inner'
                              : 'bg-slate-50 border border-slate-200/40 hover:bg-slate-100/60'}
                          `}
                        >
                          <span className={`text-[9px] font-extrabold leading-tight break-keep ${cell.stamped ? 'text-indigo-700' : 'text-slate-600'}`}>
                            {cell.name}
                          </span>

                          {/* Stamp Checkmark Stamp Animation */}
                          {cell.stamped && (
                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-500/10 rounded-xl animate-in zoom-in duration-300">
                              <div className="w-7 h-7 rounded-full border-2 border-indigo-500 flex items-center justify-center text-indigo-500 transform -rotate-12 bg-white shadow-md">
                                <Check size={14} strokeWidth={4} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3-Bingo Alert Reward */}
                  <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 rounded-2xl">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                      <div>
                        <AlertTitle className="text-indigo-900 font-bold text-xs">3줄 빙고를 만들면 리워드 지급!</AlertTitle>
                        <AlertDescription className="text-indigo-700 text-[10px] mt-0.5 font-medium leading-relaxed">
                          3줄 이상의 빙고를 완성하면 해당 대학 상권에서 현금처럼 사용할 수 있는 3,000원 금액권 쿠폰이 즉시 발급됩니다.
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                </div>
              )}

              {/* STORE QR SCAN TAB */}
              {activeTab === "scan" && (
                <div className="p-5 space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-slate-900">가게 QR 도장 인식</h2>
                    <p className="text-[10px] text-slate-400 font-medium">가게 카운터에 비치된 QR코드를 촬영해 도장을 획득하세요.</p>
                  </div>

                  {/* Camera Scanner Container */}
                  <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-black rounded-3xl overflow-hidden border-4 border-slate-900 shadow-xl">
                    <video ref={videoRef} className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`} />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {scanning && (
                      /* Frame Overlay */
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[180px] h-[180px] border border-white/20 relative">
                          {/* Scanning indicator corners */}
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-indigo-500" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-indigo-500" />
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-indigo-500" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-indigo-500" />
                          
                          {/* Laser bar animation */}
                          <div className="absolute left-0 w-full h-[2.5px] bg-indigo-500 shadow-md shadow-indigo-500/50 top-0" style={{
                            animation: "scan-anim 2s linear infinite"
                          }} />
                        </div>
                      </div>
                    )}

                    {!scanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-4 text-center space-y-3">
                        <Camera size={44} className="opacity-40 animate-pulse text-indigo-500" />
                        {cameraError ? (
                          <p className="text-[10px] text-rose-500 font-bold px-2">{cameraError}</p>
                        ) : (
                          <p className="text-[10px] text-slate-400">카메라 권한을 확인하는 중...</p>
                        )}
                      </div>
                    )}

                    {/* Result Overlay */}
                    {scannerResult && (
                      <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 ${
                        scannerResult.status === "success" ? "bg-indigo-900/95 text-white" : "bg-rose-900/95 text-white"
                      } animate-fade-in`}>
                        {scannerResult.status === "success" ? (
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-indigo-900 mb-3 shadow-md animate-in zoom-in duration-300">
                            <Check size={24} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-rose-900 mb-3 shadow-md animate-in zoom-in duration-300">
                            <AlertCircle size={24} />
                          </div>
                        )}
                        <h3 className="font-bold text-sm">{scannerResult.status === "success" ? "스탬프 적립 성공!" : "적립 실패"}</h3>
                        <p className="text-[11px] mt-1 opacity-90 max-w-[200px] break-keep">{scannerResult.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Simulation controller within camera tab for easy prototype testing */}
                  <Card className="bg-white border-slate-100 rounded-2xl shadow-sm">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <QrCode size={14} className="text-indigo-600" /> QR 스캔 시뮬레이터 (학생용)
                      </CardTitle>
                      <CardDescription className="text-[9px] text-slate-400">
                        카메라 연결 없이도 아래 가게 중 하나를 골라 모의 스캔을 실행할 수 있습니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <div className="max-h-[140px] overflow-y-auto pr-1 grid grid-cols-3 gap-1">
                        {board.map(cell => (
                          <Button
                            key={cell.id}
                            size="sm"
                            disabled={cell.stamped}
                            onClick={() => handleScannedData(`bingmoney-store-${cell.name}`)}
                            className={`h-7 text-[8px] font-semibold transition-all ${
                              cell.stamped 
                                ? "bg-slate-100 text-slate-400" 
                                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/50"
                            }`}
                          >
                            {cell.name}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* MY COUPONS TAB */}
              {activeTab === "coupons" && (
                <div className="p-5 space-y-5">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">내 보상 쿠폰함</h2>
                    <p className="text-[10px] text-slate-400 font-medium">완성된 리워드 보상을 매장 카운터에 제시하여 사용하세요.</p>
                  </div>

                  {coupons.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-100">
                      <Gift size={40} className="mx-auto mb-3 opacity-20 text-indigo-500" />
                      <p className="text-xs font-bold">보유하신 할인 쿠폰이 없습니다.</p>
                      <p className="text-[10px] text-slate-400 mt-1">빙고 3줄을 완성하여 쿠폰 리워드를 획득하세요!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {coupons.map(coupon => (
                        <Card key={coupon.id} className={`overflow-hidden rounded-2xl border border-slate-100 shadow-sm transition-opacity duration-300 ${
                          coupon.used ? 'opacity-55 bg-slate-50/50' : 'bg-white'
                        }`}>
                          <div className="flex">
                            {/* Colorful strip */}
                            <div className={`w-3.5 ${coupon.used ? 'bg-slate-300' : 'bg-indigo-600'}`} />
                            <div className="flex-1 p-4 flex flex-col justify-between">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className={`font-extrabold text-sm ${coupon.used ? 'text-slate-500' : 'text-slate-950'}`}>
                                    {coupon.title}
                                  </h3>
                                  <p className="text-[9px] text-slate-400 mt-1">발급일시: {coupon.date}</p>
                                </div>
                                {coupon.used ? (
                                  <Badge className="bg-slate-200 text-slate-600 hover:bg-slate-200 border-none text-[8px] font-bold py-1 px-2 rounded-lg">
                                    사용완료
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 border-none text-[8px] font-bold py-1 px-2 rounded-lg">
                                    사용가능
                                  </Badge>
                                )}
                              </div>
                              
                              <Button
                                variant={coupon.used ? "secondary" : "default"}
                                className={`w-full mt-4 text-[10px] font-bold py-4 rounded-xl ${
                                  coupon.used 
                                    ? "bg-slate-100 text-slate-400" 
                                    : "bg-indigo-600 hover:bg-indigo-750 text-white"
                                }`}
                                disabled={coupon.used}
                                onClick={() => setSelectedCouponForQR(coupon)}
                              >
                                {coupon.used ? "사용된 쿠폰입니다" : "스캔용 QR 코드 띄우기"}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </main>

            {/* Fixed Student Bottom Navigation Tab */}
            <nav className="bg-white border-t border-slate-100 flex items-center justify-around pb-6 pt-3 px-2 absolute bottom-0 w-full z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
              <button
                onClick={() => {
                  setStudentSubView("main");
                  setActiveTab("bingo");
                }}
                className={`flex flex-col items-center gap-1.5 p-2 transition-all ${
                  activeTab === "bingo" && studentSubView === "main" ? "text-indigo-600 scale-105 font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Store size={22} className={activeTab === "bingo" && studentSubView === "main" ? "fill-indigo-50" : ""} />
                <span className="text-[9px]">빙고판</span>
              </button>

              <button
                onClick={() => {
                  setStudentSubView("main");
                  setActiveTab("scan");
                }}
                className={`flex flex-col items-center gap-1.5 p-2 transition-all ${
                  activeTab === "scan" && studentSubView === "main" ? "text-indigo-600 scale-105 font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Camera size={22} className={activeTab === "scan" && studentSubView === "main" ? "fill-indigo-50" : ""} />
                <span className="text-[9px]">가게 QR 인식</span>
              </button>

              <button
                onClick={() => {
                  setStudentSubView("main");
                  setActiveTab("coupons");
                }}
                className={`flex flex-col items-center gap-1.5 p-2 transition-all ${
                  activeTab === "coupons" && studentSubView === "main" ? "text-indigo-600 scale-105 font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Ticket size={22} className={activeTab === "coupons" && studentSubView === "main" ? "fill-indigo-50" : ""} />
                <span className="text-[9px]">내 쿠폰</span>
              </button>
            </nav>

            {/* --- FRIEND LIST FULL OVERLAY SUB-VIEW --- */}
            {studentSubView === "friends" && (
              <div className="absolute inset-0 bg-slate-50 z-30 flex flex-col animate-fade-in pt-8">
                
                {/* Header */}
                <header className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                  <button 
                    onClick={() => setStudentSubView("main")} 
                    className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-bold text-xs transition-colors"
                  >
                    <ChevronLeft size={18} />
                    뒤로가기
                  </button>
                  <h2 className="font-extrabold text-sm text-slate-800">친구 목록</h2>
                  <div className="w-14" /> {/* Spacer */}
                </header>

                <main className="flex-1 overflow-y-auto p-5 space-y-5 pb-12">
                  {/* Friend Add Form */}
                  <Card className="bg-white border-slate-100 rounded-3xl shadow-sm">
                    <CardHeader className="p-4 pb-1">
                      <CardTitle className="text-xs font-extrabold flex items-center gap-1.5 text-slate-800">
                        <UserPlus size={15} className="text-indigo-600" /> 친구 등록
                      </CardTitle>
                      <CardDescription className="text-[9px] text-slate-400">
                        친구의 휴대폰 번호와 이름을 등록하여 빙고 대결을 시작하세요!
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <form onSubmit={handleAddFriend} className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="이름 (예: 이몽룡)"
                            value={newFriendName}
                            onChange={(e) => setNewFriendName(e.target.value)}
                            className="text-xs py-3 border-slate-200 rounded-xl"
                          />
                          <Input
                            placeholder="010-0000-0000"
                            value={newFriendPhone}
                            onChange={(e) => setNewFriendPhone(e.target.value)}
                            className="text-xs py-3 border-slate-200 rounded-xl"
                          />
                        </div>
                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-3.5 rounded-xl flex items-center justify-center gap-1">
                          <UserCheck size={12} />
                          친구 추가하기
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Friend List Render */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-extrabold text-slate-400 px-1">등록된 친구 ({friends.length}명)</h3>
                    {friends.map(friend => (
                      <div key={friend.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {friend.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-slate-900">{friend.name}</p>
                            <p className="text-[9px] text-slate-400">{friend.phone}</p>
                          </div>
                        </div>
                        <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none text-[8px] font-bold py-1 px-2.5 rounded-full">
                          {friend.bingoCount} 빙고 달성
                        </Badge>
                      </div>
                    ))}
                  </div>
                </main>
              </div>
            )}

            {/* --- USER QR MODAL --- */}
            {selectedCouponForQR && (
              <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                <Card className="w-full max-w-[310px] bg-white border-none shadow-2xl relative overflow-hidden rounded-[30px]">
                  <button 
                    onClick={() => setSelectedCouponForQR(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
                  >
                    <X size={18} />
                  </button>
                  
                  <CardHeader className="text-center pb-2 pt-6">
                    <CardTitle className="text-sm font-extrabold text-slate-900">리워드 쿠폰 제시</CardTitle>
                    <CardDescription className="text-indigo-600 font-extrabold text-xs px-2 mt-1 break-keep">
                      {selectedCouponForQR.title}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex flex-col items-center justify-center py-4">
                    {selectedCouponForQR.used ? (
                      <div className="h-[180px] flex flex-col items-center justify-center space-y-3 animate-in zoom-in duration-300">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Check size={28} strokeWidth={4} />
                        </div>
                        <p className="font-extrabold text-sm text-slate-900">사용 완료되었습니다!</p>
                        <p className="text-[10px] text-slate-400">정상 할인 처리가 기록되었습니다.</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=bingmoney-coupon-${selectedCouponForQR.id}`} 
                            alt="Coupon QR Code" 
                            className="w-[160px] h-[160px]"
                          />
                        </div>
                        
                        <div className="mt-4 flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold bg-slate-50 px-3.5 py-2 rounded-full border border-slate-100 animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          가맹점 스캔 대기 중...
                        </div>
                      </>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex flex-col space-y-2 pt-0 pb-6">
                    {!selectedCouponForQR.used && (
                      <>
                        <p className="text-center text-[9px] text-slate-400 max-w-[220px] leading-normal break-keep">
                          매장 결제 시 사장님이나 직원에게 이 화면을 보여주시면 즉시 혜택이 적용됩니다.
                        </p>
                        {/* Instant use for single-tab/offline sandbox testing */}
                        <Button 
                          variant="outline" 
                          onClick={() => handleScannedData(`bingmoney-coupon-${selectedCouponForQR.id}`)}
                          className="w-full text-[9px] text-indigo-600 border-indigo-100 hover:bg-indigo-50 mt-3 font-bold py-3.5 rounded-xl"
                        >
                          [개발자용] 자가 사용 모의 실행
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: MAIN APP (MERCHANT ROLE) --- */}
        {view === "app" && user?.role === "merchant" && (
          <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 relative overflow-hidden">
            
            {/* Admin Header */}
            <header className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 pt-8">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500 p-1.5 rounded-xl shadow-sm text-slate-950">
                  <Store size={15} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="font-extrabold text-xs tracking-tight text-white leading-none">BINGOMONEY Admin</h1>
                  <span className="text-[8px] text-emerald-400 font-bold mt-0.5 block">가맹점 정산 프로그램</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setDrawerOpen(true)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full h-8 w-8"
              >
                <Menu size={20} />
              </Button>
            </header>

            {/* Scrollable Panel */}
            <main className="flex-1 overflow-y-auto p-5 space-y-5 pb-20">
              
              {/* COUPON QR SCAN TAB (Zero-Click main screen) */}
              {activeTab === "scan" && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-sm font-extrabold text-slate-100">학생 리워드 스캔</h2>
                    <p className="text-[10px] text-slate-500 font-medium">학생의 쿠폰 QR코드를 카메라 사각형 안에 비추어 주세요.</p>
                  </div>

                  {/* Camera Scanner Viewfinder */}
                  <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-black rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl">
                    <video ref={videoRef} className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`} />
                    <canvas ref={canvasRef} className="hidden" />

                    {scanning && (
                      /* Framing overlay */
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[180px] h-[180px] border border-emerald-500/20 relative">
                          {/* Corner frames */}
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />
                          
                          {/* Scanning laser line */}
                          <div className="absolute left-0 w-full h-[2.5px] bg-emerald-400 shadow-md shadow-emerald-400/50 top-0" style={{
                            animation: "scan-anim 2s linear infinite"
                          }} />
                        </div>
                      </div>
                    )}

                    {!scanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 p-4 text-center space-y-3">
                        <Camera size={44} className="opacity-40 animate-pulse text-emerald-400" />
                        {cameraError ? (
                          <p className="text-[10px] text-rose-400 font-bold px-2">{cameraError}</p>
                        ) : (
                          <p className="text-[10px]">카메라 피드를 불러오는 중...</p>
                        )}
                      </div>
                    )}

                    {/* Success/Error overlay */}
                    {scannerResult && (
                      <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 ${
                        scannerResult.status === "success" ? "bg-emerald-600/95 text-white" : "bg-rose-600/95 text-white"
                      } animate-fade-in`}>
                        {scannerResult.status === "success" ? (
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-emerald-600 mb-3 shadow-lg animate-in zoom-in duration-300">
                            <Check size={24} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-rose-600 mb-3 shadow-lg animate-in zoom-in duration-300">
                            <AlertCircle size={24} />
                          </div>
                        )}
                        <h3 className="font-bold text-sm">{scannerResult.status === "success" ? "적용 완료!" : "적용 실패"}</h3>
                        <p className="text-[10px] mt-1 opacity-90 max-w-[200px] break-keep">{scannerResult.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Toggle Camera state */}
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => setCameraEnabled(!cameraEnabled)}
                      className={`w-full max-w-[280px] py-4 text-xs font-bold rounded-xl transition-colors ${
                        cameraEnabled ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                      }`}
                    >
                      {cameraEnabled ? "카메라 스캔 임시 중지" : "카메라 스캔 다시 시작"}
                    </Button>
                  </div>

                  {/* Simulation panel */}
                  <Card className="bg-slate-900 border-slate-800 rounded-2xl shadow-sm text-slate-100">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <QrCode size={14} className="text-emerald-400" /> 모의 정산 스캐너 (가맹점용)
                      </CardTitle>
                      <CardDescription className="text-[9px] text-slate-500">
                        현재 발급된 미사용 학생 쿠폰 중 하나를 선택해 즉시 모의 정산 처리를 실행할 수 있습니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      {coupons.filter(c => !c.used).length === 0 ? (
                        <p className="text-[10px] text-slate-600 text-center py-4 font-medium">대기 중인 사용자 쿠폰이 없습니다.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                          {coupons.filter(c => !c.used).map(coupon => (
                            <div key={coupon.id} className="flex justify-between items-center bg-slate-850 p-2 border border-slate-800 rounded-xl text-[10px]">
                              <span className="font-semibold truncate max-w-[170px] text-slate-300">{coupon.title}</span>
                              <Button 
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 h-7 px-3 text-[9px] font-extrabold rounded-lg"
                                onClick={() => handleScannedData(`bingmoney-coupon-${coupon.id}`)}
                              >
                                스캔 실행
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* COUPON SCAN HISTORY TAB */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  
                  {/* Header / Export actions */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-100">스탬프/쿠폰 정산 내역</h2>
                      <p className="text-[10px] text-slate-500 font-medium">부대통령뚝배기 매장에서 승인된 정산 건입니다.</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleExportLogs}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[9px] px-3.5 py-4 rounded-xl flex items-center gap-1 shadow-md transition-all"
                    >
                      <Share2 size={13} strokeWidth={2.5} />
                      내보내기
                    </Button>
                  </div>

                  {merchantLogs.length === 0 ? (
                    <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-900 text-slate-600">
                      <History size={36} className="mx-auto mb-3 opacity-20 text-emerald-400" />
                      <p className="text-xs font-bold">정산 처리된 내역이 없습니다.</p>
                      <p className="text-[10px] mt-1 text-slate-600">대기 중인 사용자 쿠폰을 스캔하여 정산을 시작하세요.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {merchantLogs.map((log, idx) => (
                        <div key={log.id} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex justify-between items-center text-[10px]">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-200">{log.title}</p>
                            <p className="text-[8px] text-slate-500 font-medium">{log.date} {log.time}</p>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] font-bold py-1 px-2 rounded-lg">
                            정산완료
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </main>

            {/* Merchant Fixed Bottom Tab Navigation */}
            <nav className="bg-slate-900 border-t border-slate-800 flex items-center justify-around pb-6 pt-3 px-2 absolute bottom-0 w-full z-10 shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.5)]">
              <button
                onClick={() => setActiveTab("scan")}
                className={`flex flex-col items-center gap-1.5 p-2 transition-all ${
                  activeTab === "scan" ? "text-emerald-400 scale-105 font-bold" : "text-slate-500 hover:text-slate-400"
                }`}
              >
                <Camera size={22} className={activeTab === "scan" ? "fill-emerald-950/20" : ""} />
                <span className="text-[9px]">쿠폰 QR 인식</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex flex-col items-center gap-1.5 p-2 transition-all ${
                  activeTab === "history" ? "text-emerald-400 scale-105 font-bold" : "text-slate-500 hover:text-slate-400"
                }`}
              >
                <History size={22} className={activeTab === "history" ? "fill-emerald-950/20" : ""} />
                <span className="text-[9px]">쿠폰 인식 내역</span>
              </button>
            </nav>

          </div>
        )}

      </div>

      {/* Global CSS Style Animations */}
      <style jsx global>{`
        @keyframes scan-anim {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>

    </div>
  );
}
