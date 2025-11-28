import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArtInfo } from './types';
import { getArtInfo } from './services/geminiService';
import { CameraIcon } from './components/CameraIcon';
import { LoadingSpinner } from './components/LoadingSpinner';
import { CameraOffIcon } from './components/CameraOffIcon';
import { AuthForm } from './components/AuthForm';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [artInfo, setArtInfo] = useState<ArtInfo | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 認証状態をチェック
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = sessionStorage.getItem('artlens_authenticated') === 'true';
      const authTime = sessionStorage.getItem('artlens_auth_time');
      
      // セッションが24時間以内かチェック（オプション）
      if (authenticated && authTime) {
        const timeDiff = Date.now() - parseInt(authTime, 10);
        const hours24 = 24 * 60 * 60 * 1000;
        if (timeDiff > hours24) {
          // 24時間経過したら認証を無効化
          sessionStorage.removeItem('artlens_authenticated');
          sessionStorage.removeItem('artlens_auth_time');
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setIsCheckingAuth(false);
  };

  // 認証チェック中は何も表示しない
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 font-sans flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // 認証されていない場合は認証フォームを表示
  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOn(true);
      setError(null); // Clear previous errors
    } catch (err) {
      console.error("カメラへのアクセスエラー:", err);
      setError("カメラにアクセスできませんでした。権限を許可して、もう一度お試しください。");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
      setCapturedImage(null);
      setArtInfo(null);
    }
  }, [stream]);
  
  const resetView = useCallback(() => {
    setArtInfo(null);
    setCapturedImage(null);
    setError(null);
    if (!isCameraOn) {
      startCamera();
    }
  }, [isCameraOn, startCamera]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraOn) return;

    setIsLoading(true);
    setArtInfo(null);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if(!context) {
        setError("キャンバスコンテキストを取得できませんでした。");
        setIsLoading(false);
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const base64Data = imageDataUrl.split(',')[1];
    
    // 撮影した画像を保存
    setCapturedImage(imageDataUrl);

    try {
      const info = await getArtInfo(base64Data);
      setArtInfo(info);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || '絵画を分析できませんでした。より鮮明な画像でもう一度お試しください。';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-4xl font-bold text-center mb-2 text-white">
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ArtLens AI</span>
        </h1>
        <p className="text-center text-gray-400 mb-6">美術館で絵画を詳しく理解するアプリ</p>
        
        <div className="w-full max-w-4xl mx-auto">
          {/* カメラビュー/撮影画像 */}
          <div className="relative w-full aspect-[3/4] bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border-2 border-gray-700">
            {/* カメラビューまたは撮影画像 */}
            {capturedImage && !isCameraOn ? (
              <img 
                src={capturedImage} 
                alt="撮影した絵画" 
                className="w-full h-full object-contain"
              />
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-contain ${!isCameraOn && 'hidden'}`} 
              />
            )}
            
            {!isCameraOn && !capturedImage && (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                {!error ? (
                  <div className="space-y-4">
                    <div className="text-6xl mb-4">🎨</div>
                    <button 
                      onClick={startCamera}
                      className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all transform hover:scale-105 shadow-lg"
                    >
                      カメラを起動する
                    </button>
                    <p className="text-gray-400 text-sm mt-4">
                      絵画にカメラを向けて、撮影ボタンをタップしてください
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {isCameraOn && (
              <>
                <button
                  onClick={stopCamera}
                  className="absolute top-4 right-4 p-3 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-400 z-20"
                  aria-label="カメラをオフにする"
                >
                  <CameraOffIcon />
                </button>
                
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                </div>
              </>
            )}

            {/* 説明文のオーバーレイ */}
            {artInfo && capturedImage && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 p-6 overflow-y-auto z-10 animate-fade-in">
                <div className="h-full flex flex-col">
                  <div className="flex-grow">
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-2 leading-tight">
                      {artInfo.title}
                    </h2>
                    <h3 className="text-xl font-medium text-indigo-400 mb-6">
                      {artInfo.artist} <span className="text-gray-300">({artInfo.year})</span>
                    </h3>
                    
                    <div className="space-y-5 text-gray-200 text-base leading-relaxed">
                      <div className="bg-black/40 backdrop-blur-sm rounded-lg p-5 border border-white/10">
                        <h4 className="font-semibold text-lg text-white mb-3 pb-2 border-b border-white/20 flex items-center">
                          <span className="mr-2">📖</span>
                          作品解説
                        </h4>
                        <p className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                          {artInfo.description}
                        </p>
                      </div>
                      
                      <div className="bg-black/40 backdrop-blur-sm rounded-lg p-5 border border-white/10">
                        <h4 className="font-semibold text-lg text-white mb-3 pb-2 border-b border-white/20 flex items-center">
                          <span className="mr-2">🏛️</span>
                          時代背景
                        </h4>
                        <p className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                          {artInfo.historicalContext}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                    <button 
                      onClick={resetView}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all transform hover:scale-105 shadow-lg"
                    >
                      別の絵画をスキャン
                    </button>
                    <button
                      onClick={() => {
                        setArtInfo(null);
                        setCapturedImage(null);
                        if (isCameraOn) {
                          stopCamera();
                        }
                        startCamera();
                      }}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-all"
                    >
                      カメラに戻る
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ローディング表示 */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                <LoadingSpinner />
                <p className="mt-6 text-white text-lg">絵画を分析中...</p>
                <p className="mt-2 text-gray-300 text-sm">AIが作品を識別しています</p>
              </div>
            )}

            {/* エラー表示 */}
            {error && !artInfo && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-6 overflow-y-auto">
                <div className="max-w-2xl w-full">
                  <div className="text-5xl mb-4 text-center">⚠️</div>
                  <h2 className="text-2xl font-semibold mb-4 text-red-400 text-center">エラーが発生しました</h2>
                  <div className="bg-gray-900/80 rounded-lg p-6 mb-6">
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {error.split('\n').map((line, index) => {
                        // URLを検出してリンクにする
                        const urlRegex = /(https?:\/\/[^\s]+)/g;
                        const parts = line.split(urlRegex);
                        return (
                          <span key={index}>
                            {parts.map((part, partIndex) => {
                              if (part.match(urlRegex)) {
                                return (
                                  <a
                                    key={partIndex}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-400 hover:text-indigo-300 underline break-all"
                                  >
                                    {part}
                                  </a>
                                );
                              }
                              return <span key={partIndex}>{part}</span>;
                            })}
                            {index < error.split('\n').length - 1 && <br />}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button 
                      onClick={() => {
                        setError(null);
                        setCapturedImage(null);
                        if (!isCameraOn) startCamera();
                      }} 
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition-colors"
                    >
                      再試行
                    </button>
                    <button
                      onClick={() => {
                        setError(null);
                        setCapturedImage(null);
                        if (isCameraOn) {
                          stopCamera();
                        }
                      }}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 撮影ボタン */}
            {isCameraOn && !artInfo && (
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-center z-20">
                <button
                  onClick={handleCapture}
                  disabled={isLoading}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-110 active:scale-95 shadow-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-black focus:ring-indigo-400"
                  aria-label="絵画を分析"
                >
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <CameraIcon />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default App;