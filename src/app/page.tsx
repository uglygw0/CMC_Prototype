"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, Ticket, Users, Home, Gift, UserPlus, ShoppingBag, ArrowRight, AlertCircle, Phone, Store, User, MapPin, X, Camera, QrCode, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  // App State
  const [view, setView] = useState<"login" | "signup" | "app">("login");
  const [activeTab, setActiveTab] = useState<"home" | "coupons" | "friends">("home");
  const [toastMessage, setToastMessage] = useState("");

  // Login Config State
  const [loginRole, setLoginRole] = useState<"user" | "admin">("user");
  const [adminForm, setAdminForm] = useState({ id: "", password: "" });

  // User State
  const [user, setUser] = useState({ name: "", phone: "", birth: "", role: "user" });

  // Bingo State
  const [board, setBoard] = useState<{ id: number; name: string; stamped: boolean }[]>([]);
  const [bingoCount, setBingoCount] = useState(0);

  // Reward State
  const [coupons, setCoupons] = useState<{ id: string; title: string; used: boolean; date: string }[]>([]);

  // Friends State
  const [friends, setFriends] = useState([
    { id: "f1", name: "김민수", phone: "010-1234-5678", bingoCount: 2 },
    { id: "f2", name: "이지은", phone: "010-9876-5432", bingoCount: 0 }
  ]);
  const [newFriendPhone, setNewFriendPhone] = useState("");

  // QR Modal State
  const [selectedCouponForQR, setSelectedCouponForQR] = useState<{ id: string; title: string; used: boolean } | null>(null);

  // Admin Scanner state
  const [scanning, setScanning] = useState(false);
  const [scannerResult, setScannerResult] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [adminLogs, setAdminLogs] = useState<{ id: string; title: string; time: string }[]>([]);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load state from LocalStorage on mount
  useEffect(() => {
    // 1. Board
    const savedBoard = localStorage.getItem("bingmoney_board");
    if (savedBoard) {
      setBoard(JSON.parse(savedBoard));
    } else {
      const shuffled = shuffleArray(STORE_NAMES);
      const initialBoard = shuffled.map((name, idx) => ({ id: idx, name, stamped: false }));
      setBoard(initialBoard);
      localStorage.setItem("bingmoney_board", JSON.stringify(initialBoard));
    }

    // 2. Coupons
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

    // 3. Bingo Count
    const savedBingoCount = localStorage.getItem("bingmoney_bingoCount");
    if (savedBingoCount) {
      setBingoCount(parseInt(savedBingoCount, 10));
    }

    // 4. Admin logs
    const savedLogs = localStorage.getItem("bingmoney_admin_logs");
    if (savedLogs) {
      setAdminLogs(JSON.parse(savedLogs));
    }

    // 5. User role session if any
    const savedUser = localStorage.getItem("bingmoney_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setView("app");
    }
  }, []);

  // Sync state to LocalStorage
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

  const updateAdminLogs = (newLogs: typeof adminLogs) => {
    setAdminLogs(newLogs);
    localStorage.setItem("bingmoney_admin_logs", JSON.stringify(newLogs));
  };

  // Listen for storage changes across tabs (live sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bingmoney_coupons" && e.newValue) {
        const parsedCoupons = JSON.parse(e.newValue);
        setCoupons(parsedCoupons);

        // If the QR Modal is currently open, check if the scanned coupon is updated to used
        if (selectedCouponForQR) {
          const matching = parsedCoupons.find((c: any) => c.id === selectedCouponForQR.id);
          if (matching && matching.used) {
            setSelectedCouponForQR({ ...selectedCouponForQR, used: true });
            showToast("쿠폰 사용이 확인되었습니다!");
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
      if (e.key === "bingmoney_admin_logs" && e.newValue) {
        setAdminLogs(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [selectedCouponForQR]);

  // Polling fallback to detect coupon status change (even in same window if tested sequentially)
  useEffect(() => {
    if (!selectedCouponForQR || selectedCouponForQR.used) return;

    const interval = setInterval(() => {
      const savedCoupons = localStorage.getItem("bingmoney_coupons");
      if (savedCoupons) {
        const parsed = JSON.parse(savedCoupons);
        const current = parsed.find((c: any) => c.id === selectedCouponForQR.id);
        if (current && current.used) {
          setCoupons(parsed);
          setSelectedCouponForQR({ ...selectedCouponForQR, used: true });
          showToast("쿠폰 사용이 확인되었습니다!");
          setTimeout(() => {
            setSelectedCouponForQR(null);
          }, 2000);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedCouponForQR]);

  // Load jsQR script dynamically when in admin mode
  useEffect(() => {
    if (user.role !== "admin") return;
    
    const scriptId = "jsqr-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [user.role]);

  // Camera access controller for scanner
  useEffect(() => {
    if (user.role !== "admin") return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError("");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
          setScanning(true);
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setCameraError("카메라 연결을 확인할 수 없습니다. 권한을 허용해 주세요.");
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
  }, [user.role]);

  // QR Scanning loop
  useEffect(() => {
    if (!scanning || user.role !== "admin") return;

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
  }, [scanning, user.role]);

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
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.error("Audio Context failed:", e);
    }
  };

  // Handle scanned Coupon QR Code
  const handleScannedData = (data: string) => {
    if (scannerResult) return;

    if (data.startsWith("bingmoney-coupon-")) {
      const couponId = data.replace("bingmoney-coupon-", "");
      
      const savedCoupons = localStorage.getItem("bingmoney_coupons");
      if (savedCoupons) {
        const parsedCoupons = JSON.parse(savedCoupons);
        const couponIndex = parsedCoupons.findIndex((c: any) => c.id === couponId);
        
        if (couponIndex !== -1) {
          const coupon = parsedCoupons[couponIndex];
          if (!coupon.used) {
            // Success!
            parsedCoupons[couponIndex].used = true;
            localStorage.setItem("bingmoney_coupons", JSON.stringify(parsedCoupons));
            setCoupons(parsedCoupons);

            playBeepSound();
            setScannerResult({
              status: "success",
              message: `[적용 완료] ${coupon.title}`
            });

            // Log entry
            const timeStr = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const newLog = { id: Date.now().toString(), title: coupon.title, time: timeStr };
            const updatedLogs = [newLog, ...adminLogs].slice(0, 10);
            setAdminLogs(updatedLogs);
            localStorage.setItem("bingmoney_admin_logs", JSON.stringify(updatedLogs));

            setTimeout(() => {
              setScannerResult(null);
            }, 3000);
          } else {
            setScannerResult({
              status: "error",
              message: "이미 사용 완료된 쿠폰입니다!"
            });
            setTimeout(() => {
              setScannerResult(null);
            }, 3000);
          }
        } else {
          setScannerResult({
            status: "error",
            message: "유효하지 않은 쿠폰입니다."
          });
          setTimeout(() => {
            setScannerResult(null);
          }, 3000);
        }
      }
    }
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginRole === "admin") {
      if (adminForm.id === "admin" && adminForm.password === "1234") {
        const adminUser = { name: "가맹점 관리자", phone: "010-0000-0000", birth: "", role: "admin" };
        setUser(adminUser);
        localStorage.setItem("bingmoney_user", JSON.stringify(adminUser));
        setView("app");
        showToast("관리자 모드로 로그인했습니다.");
      } else {
        showToast("아이디 또는 비밀번호가 잘못되었습니다.");
      }
    } else {
      if (!user.phone) {
        showToast("전화번호를 입력해주세요.");
        return;
      }
      const regularUser = { name: user.name || "사용자", phone: user.phone, birth: user.birth || "", role: "user" };
      setUser(regularUser);
      localStorage.setItem("bingmoney_user", JSON.stringify(regularUser));
      setView("app");
      showToast("환영합니다!");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.name || !user.phone || !user.birth) {
      showToast("모든 항목을 입력해주세요.");
      return;
    }
    const regularUser = { name: user.name, phone: user.phone, birth: user.birth, role: "user" };
    setUser(regularUser);
    localStorage.setItem("bingmoney_user", JSON.stringify(regularUser));
    setView("app");
    showToast("회원가입이 완료되었습니다!");
  };

  const handleLogout = () => {
    setUser({ name: "", phone: "", birth: "", role: "user" });
    localStorage.removeItem("bingmoney_user");
    setView("login");
    setActiveTab("home");
    setScanning(false);
    showToast("로그아웃되었습니다.");
  };

  const handleMockPurchase = () => {
    // Find an unstamped cell
    const unstamped = board.filter(cell => !cell.stamped);
    if (unstamped.length === 0) {
      showToast("이미 모든 빙고를 완료하셨습니다!");
      return;
    }

    // Pick random cell to stamp
    const target = unstamped[Math.floor(Math.random() * unstamped.length)];
    const newBoard = board.map(cell => cell.id === target.id ? { ...cell, stamped: true } : cell);
    updateBoard(newBoard);

    const newBingoCount = checkBingos(newBoard.map(c => c.stamped));

    // Check if new bingo achieved
    if (newBingoCount > bingoCount) {
      updateBingoCount(newBingoCount);
      if (newBingoCount >= 3 && bingoCount < 3) {
        // Reward at 3 bingos
        const newCoupons = [{ id: Date.now().toString(), title: "[3빙고 달성] 상권 3,000원 할인권", used: false, date: "방금 전" }, ...coupons];
        updateCoupons(newCoupons);
        showToast("축하합니다! 3빙고 달성으로 할인 쿠폰이 지급되었습니다.");
      } else {
        showToast(`빙고 1줄 완성! 현재 ${newBingoCount}빙고입니다.`);
      }
    } else {
      showToast(`'${target.name}'에서 결제가 확인되어 스탬프가 찍혔습니다!`);
    }
  };

  const handleUseCoupon = (id: string) => {
    const newCoupons = coupons.map(c => c.id === id ? { ...c, used: true } : c);
    updateCoupons(newCoupons);
    showToast("쿠폰이 사용 처리되었습니다.");
  };

  const handleAddFriend = () => {
    if (!newFriendPhone.trim()) {
      showToast("친구의 전화번호를 입력해주세요.");
      return;
    }
    setFriends([...friends, { id: Date.now().toString(), name: "새로운 친구", phone: newFriendPhone, bingoCount: 0 }]);
    setNewFriendPhone("");
    showToast("친구가 성공적으로 추가되었습니다.");
  };

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4 font-sans text-slate-900">

      {/* CSS For scan animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan-anim {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan {
          animation: scan-anim 2s linear infinite;
        }
      `}} />

      {/* Mobile Frame Container */}
      <div className="w-full max-w-[400px] h-[800px] max-h-screen bg-white rounded-3xl shadow-2xl overflow-hidden relative flex flex-col border-4 border-slate-800">

        {/* Global Toast */}
        {toastMessage && (
          <div className="absolute top-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4">
            <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center justify-between">
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage("")}><X size={16} /></button>
            </div>
          </div>
        )}

        {/* --- VIEW: LOGIN --- */}
        {view === "login" && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center space-y-2">
                <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                  <MapPin size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">BINGMONEY</h1>
                <p className="text-slate-500 text-sm">대학 상권을 깨우는 달콤한 보상</p>
              </div>

              {/* Login Role Tabs Selector */}
              <div className="w-full flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLoginRole("user")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    loginRole === "user"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  일반 사용자
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole("admin")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    loginRole === "admin"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  가맹점 관리자
                </button>
              </div>

              <Card className="w-full border-none shadow-none">
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4 px-0">
                    {loginRole === "user" ? (
                      <div className="space-y-2">
                        <Label htmlFor="phone">전화번호</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            id="phone"
                            placeholder="010-0000-0000"
                            className="pl-9 bg-slate-50"
                            value={user.phone}
                            onChange={(e) => setUser({ ...user, phone: e.target.value })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="admin-id">관리자 아이디</Label>
                          <Input
                            id="admin-id"
                            placeholder="admin"
                            value={adminForm.id}
                            onChange={(e) => setAdminForm({ ...adminForm, id: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="admin-pw">비밀번호</Label>
                          <Input
                            id="admin-pw"
                            type="password"
                            placeholder="1234"
                            value={adminForm.password}
                            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg text-center">
                          테스트용 ID: <strong className="text-indigo-600">admin</strong> / PW: <strong className="text-indigo-600">1234</strong>
                        </p>
                      </div>
                    )}
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-md py-6">
                      로그인
                    </Button>
                  </CardContent>
                </form>
                {loginRole === "user" && (
                  <CardFooter className="px-0 flex justify-center pt-0">
                    <Button variant="link" onClick={() => setView("signup")} className="text-indigo-600 text-xs">
                      처음이신가요? 회원가입하기
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* --- VIEW: SIGNUP --- */}
        {view === "signup" && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="mb-6">
              <Button variant="ghost" size="icon" onClick={() => setView("login")} className="-ml-2">
                <ArrowRight className="h-5 w-5 rotate-180" />
              </Button>
            </div>
            <h2 className="text-2xl font-bold mb-2">반갑습니다!</h2>
            <p className="text-slate-500 text-sm mb-8">기본 정보를 입력하고 주변 상권 혜택을 누려보세요.</p>

            <form onSubmit={handleSignup} className="space-y-6 flex-1 flex flex-col">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">이름</Label>
                  <Input
                    id="signup-name"
                    placeholder="홍길동"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">전화번호</Label>
                  <Input
                    id="signup-phone"
                    placeholder="010-0000-0000"
                    value={user.phone}
                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">결제 시 이 번호로 스탬프가 적립됩니다.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-birth">생년월일</Label>
                  <Input
                    id="signup-birth"
                    placeholder="YYYYMMDD (예: 20010505)"
                    value={user.birth}
                    onChange={(e) => setUser({ ...user, birth: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-auto pt-6">
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-md">
                  동의하고 시작하기
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* --- VIEW: MAIN APP (USER ROLE) --- */}
        {view === "app" && user.role === "user" && (
          <>
            {/* Top Bar */}
            <header className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <MapPin size={16} className="text-white" />
                </div>
                <h1 className="font-bold text-lg tracking-tight">BINGMONEY</h1>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center p-0"
              >
                <User size={16} className="text-slate-600" />
              </Button>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">

              {/* HOME TAB */}
              {activeTab === "home" && (
                <div className="p-5 space-y-6">
                  {/* Action Mock Card */}
                  <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-none text-white shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingBag size={18} />
                        방금 가게에서 결제하셨나요?
                      </CardTitle>
                      <CardDescription className="text-indigo-100">
                        전화번호를 통해 자동으로 스탬프가 적립됩니다. MVP 검증을 위해 아래 버튼을 눌러보세요.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleMockPurchase}
                        className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold"
                      >
                        결제 확인 목업 실행하기
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Bingo Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">우리 동네 빙고판</h2>
                      <p className="text-sm text-slate-500">다양한 가게를 방문하고 보상을 받으세요!</p>
                    </div>
                    <Badge variant={bingoCount >= 3 ? "default" : "secondary"} className={bingoCount >= 3 ? "bg-green-500 hover:bg-green-600" : ""}>
                      {bingoCount} 빙고 달성
                    </Badge>
                  </div>

                  {/* Bingo Grid 5x5 */}
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-5 gap-1.5">
                      {board.map((cell) => (
                        <div
                          key={cell.id}
                          className={`
                            relative aspect-square rounded-lg flex flex-col items-center justify-center p-1 text-center transition-all
                            ${cell.stamped
                              ? 'bg-indigo-50 border-2 border-indigo-500'
                              : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'}
                          `}
                        >
                          <span className={`text-[10px] font-medium leading-tight ${cell.stamped ? 'text-indigo-700' : 'text-slate-600'}`}>
                            {cell.name}
                          </span>

                          {/* Stamp Mark */}
                          {cell.stamped && (
                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-500/10 rounded-lg animate-in zoom-in-50 duration-300">
                              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 flex items-center justify-center text-indigo-500 transform -rotate-12 bg-white/80 backdrop-blur-sm shadow-sm">
                                <Check size={18} strokeWidth={3} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert className="bg-blue-50 border-blue-100">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800 font-bold">3빙고를 완성해보세요!</AlertTitle>
                    <AlertDescription className="text-blue-700 text-sm mt-1">
                      3빙고 달성 시 가맹점에서 사용 가능한 3,000원 할인 쿠폰이 즉시 지급됩니다.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* COUPONS TAB */}
              {activeTab === "coupons" && (
                <div className="p-5 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">내 쿠폰함</h2>
                    <p className="text-sm text-slate-500">달성한 보상을 매장에서 사용하세요.</p>
                  </div>

                  {coupons.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Gift size={48} className="mx-auto mb-3 opacity-20" />
                      <p>아직 보유한 쿠폰이 없습니다.</p>
                      <p className="text-sm">빙고를 완성하고 쿠폰을 받아보세요!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {coupons.map(coupon => (
                        <Card key={coupon.id} className={`overflow-hidden transition-opacity ${coupon.used ? 'opacity-60 bg-slate-50' : 'bg-white'}`}>
                          <div className="flex">
                            {/* Decorative Left Border */}
                            <div className={`w-3 ${coupon.used ? 'bg-slate-300' : 'bg-indigo-500'}`} />
                            <div className="flex-1 p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold ${coupon.used ? 'text-slate-500' : 'text-slate-900'}`}>{coupon.title}</h3>
                                {coupon.used && <Badge variant="outline">사용 완료</Badge>}
                              </div>
                              <p className="text-xs text-slate-400 mb-4">발급일: {coupon.date}</p>

                              <Button
                                variant={coupon.used ? "secondary" : "default"}
                                className={`w-full ${!coupon.used && 'bg-indigo-600 hover:bg-indigo-700'}`}
                                disabled={coupon.used}
                                onClick={() => setSelectedCouponForQR(coupon)}
                              >
                                {coupon.used ? "사용된 쿠폰입니다" : "매장에서 사용하기"}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* FRIENDS TAB */}
              {activeTab === "friends" && (
                <div className="p-5 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold">친구 목록</h2>
                    <p className="text-sm text-slate-500">친구들과 진행 상황을 공유해보세요.</p>
                  </div>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <UserPlus size={16} /> 친구 추가
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input
                          placeholder="전화번호 입력 (010...)"
                          value={newFriendPhone}
                          onChange={(e) => setNewFriendPhone(e.target.value)}
                        />
                        <Button onClick={handleAddFriend} className="bg-slate-900">추가</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-500 px-1">등록된 친구 ({friends.length})</h3>
                    {friends.map(friend => (
                      <div key={friend.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                            {friend.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{friend.name}</p>
                            <p className="text-xs text-slate-500">{friend.phone}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                          {friend.bingoCount} 빙고
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-white border-t border-slate-200 flex items-center justify-around pb-6 pt-3 px-2 absolute bottom-0 w-full z-10">
              <button
                onClick={() => setActiveTab("home")}
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === "home" ? "text-indigo-600" : "text-slate-400"}`}
              >
                <Store size={24} className={activeTab === "home" ? "fill-indigo-50" : ""} />
                <span className="text-[10px] font-medium">빙고판</span>
              </button>

              <button
                onClick={() => setActiveTab("coupons")}
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === "coupons" ? "text-indigo-600" : "text-slate-400"}`}
              >
                <Ticket size={24} className={activeTab === "coupons" ? "fill-indigo-50" : ""} />
                <span className="text-[10px] font-medium">내 쿠폰</span>
              </button>

              <button
                onClick={() => setActiveTab("friends")}
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === "friends" ? "text-indigo-600" : "text-slate-400"}`}
              >
                <Users size={24} className={activeTab === "friends" ? "fill-indigo-50" : ""} />
                <span className="text-[10px] font-medium">친구 목록</span>
              </button>
            </nav>

            {/* --- USER QR MODAL --- */}
            {selectedCouponForQR && (
              <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                <Card className="w-full max-w-[320px] bg-white border-none shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                  <button 
                    onClick={() => setSelectedCouponForQR(null)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                  
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg font-bold text-slate-800">쿠폰 사용하기</CardTitle>
                    <CardDescription className="text-indigo-600 font-semibold px-2">
                      {selectedCouponForQR.title}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex flex-col items-center justify-center py-4">
                    {selectedCouponForQR.used ? (
                      <div className="h-[200px] flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <Check size={36} strokeWidth={3} />
                        </div>
                        <p className="font-bold text-lg text-slate-800">사용 완료되었습니다!</p>
                        <p className="text-sm text-slate-500">할인이 성공적으로 적용되었습니다.</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=bingmoney-coupon-${selectedCouponForQR.id}`} 
                            alt="Coupon QR Code" 
                            className="w-[180px] h-[180px]"
                          />
                        </div>
                        
                        <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-medium bg-slate-50 px-3 py-2 rounded-full border border-slate-100 animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          스캔 대기 중...
                        </div>
                      </>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex flex-col space-y-2 pt-0">
                    {!selectedCouponForQR.used && (
                      <>
                        <p className="text-center text-[10px] text-slate-400">
                          가맹점 카운터의 직원에게 이 QR코드를 보여주세요.
                        </p>
                        {/* Instant use for 1-screen testing */}
                        <Button 
                          variant="outline" 
                          onClick={() => handleScannedData(`bingmoney-coupon-${selectedCouponForQR.id}`)}
                          className="w-full text-xs text-indigo-600 border-indigo-100 hover:bg-indigo-50 mt-2"
                        >
                          테스트용 즉시 사용 처리
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              </div>
            )}
          </>
        )}

        {/* --- VIEW: MAIN APP (ADMIN ROLE) --- */}
        {view === "app" && user.role === "admin" && (
          <div className="flex-1 flex flex-col h-full bg-slate-900 text-white relative">
            {/* Admin Header */}
            <header className="bg-slate-800 px-5 py-4 border-b border-slate-700 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <Store size={16} className="text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-md tracking-tight leading-none">BINGMONEY Admin</h1>
                  <span className="text-[10px] text-indigo-400 font-semibold">가맹점 정산용</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full h-8 w-8"
              >
                <LogOut size={16} />
              </Button>
            </header>

            {/* Scrollable Panel */}
            <main className="flex-1 overflow-y-auto p-5 space-y-6 pb-6">
              
              {/* Header Description */}
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100">쿠폰 스캐너</h2>
                <p className="text-xs text-slate-400">사용자의 QR코드를 화면의 사각형 안에 대어주세요.</p>
              </div>

              {/* Camera Scanner Viewfinder Container */}
              <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
                {scanning ? (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Scanner Framing Box Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[180px] h-[180px] border border-indigo-500/20 relative">
                        {/* Neon green corner lines */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />
                        
                        {/* Red scanning laser line */}
                        <div className="absolute left-0 w-full h-[2px] bg-red-500 shadow-md shadow-red-500/50 animate-scan" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-4 text-center space-y-3">
                    <Camera size={48} className="opacity-40 animate-pulse text-indigo-400" />
                    {cameraError ? (
                      <p className="text-xs text-rose-400 font-semibold px-2">{cameraError}</p>
                    ) : (
                      <p className="text-xs">카메라를 연결하는 중입니다...</p>
                    )}
                  </div>
                )}

                {/* Scanner Success/Error result Overlay */}
                {scannerResult && (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 ${
                    scannerResult.status === "success" ? "bg-emerald-600/95" : "bg-rose-600/95"
                  } animate-in fade-in duration-200`}>
                    {scannerResult.status === "success" ? (
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-emerald-600 mb-3 shadow-lg animate-in zoom-in duration-300">
                        <Check size={32} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-rose-600 mb-3 shadow-lg animate-in zoom-in duration-300">
                        <AlertCircle size={32} strokeWidth={3} />
                      </div>
                    )}
                    <h3 className="font-bold text-md">{scannerResult.status === "success" ? "적용되었습니다!" : "스캔 실패"}</h3>
                    <p className="text-xs mt-1.5 text-slate-100 max-w-[200px] break-words">{scannerResult.message}</p>
                  </div>
                )}
              </div>

              {/* Toggle Scanning Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={() => setScanning(!scanning)}
                  className={`w-full max-w-[280px] py-5 font-bold ${
                    scanning ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {scanning ? "카메라 스캔 중지" : "카메라 스캔 시작"}
                </Button>
              </div>

              {/* Simulation Scanners Panel (Awesome for testing in 1 browser) */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-200">
                    <QrCode size={16} /> 시뮬레이션 스캔 (1인 테스트용)
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400">
                    카메라 테스트가 어려울 때, 현재 발급된 미사용 쿠폰을 선택해 정산 처리를 시뮬레이션할 수 있습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {coupons.filter(c => !c.used).length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">대기 중인 사용자 쿠폰이 없습니다.</p>
                  ) : (
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {coupons.filter(c => !c.used).map(coupon => (
                        <div key={coupon.id} className="flex justify-between items-center bg-slate-700 p-2 rounded-lg text-xs">
                          <span className="font-medium truncate max-w-[170px] text-slate-200">{coupon.title}</span>
                          <Button 
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 px-3 text-[10px] font-bold"
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

              {/* Admin History Logs */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <History size={14} /> 최근 적용 내역 ({adminLogs.length})
                </h3>
                {adminLogs.length === 0 ? (
                  <div className="text-center py-6 bg-slate-800/40 rounded-xl border border-slate-800 text-slate-500 text-xs">
                    최근 적용된 내역이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {adminLogs.map(log => (
                      <div key={log.id} className="bg-slate-800/70 border border-slate-700/50 p-3 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200">{log.title}</p>
                          <p className="text-[10px] text-slate-500">{log.time}</p>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-none">
                          적용 완료
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </main>
          </div>
        )}

      </div>
    </div>
  );
}
