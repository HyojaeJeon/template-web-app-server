/**
 * @fileoverview 웹 워커 관리 훅 - 메인 스레드 블로킹 없는 백그라운드 작업
 * @description 무거운 계산 작업을 웹 워커로 분리하여 UI 반응성 유지
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 웹 워커 관리 훅
 * 
 * @param {string|Function} workerScript - 워커 스크립트 URL 또는 함수
 * @param {Object} options - 워커 옵션
 * @param {boolean} [options.autoTerminate=true] - 자동 종료 여부
 * @param {number} [options.timeout=30000] - 작업 타임아웃 (ms)
 * @returns {Object} 워커 상태와 메서드
 */
export const useWorker = (workerScript, options = {}) => {
  const { autoTerminate = true, timeout = 30000 } = options;
  
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const workerRef = useRef(null);
  const timeoutRef = useRef(null);
  const resolveRef = useRef(null);
  const rejectRef = useRef(null);

  // 워커 초기화
  const initializeWorker = useCallback(() => {
    try {
      let worker;
      
      if (typeof workerScript === 'string') {
        // URL에서 워커 생성
        worker = new Worker(workerScript);
      } else if (typeof workerScript === 'function') {
        // 함수를 Blob URL로 변환하여 워커 생성
        const blob = new Blob([`
          self.onmessage = function(e) {
            const { id, data } = e.data;
            try {
              const fn = ${workerScript.toString()};
              const result = fn(data);
              
              if (result instanceof Promise) {
                result
                  .then(res => self.postMessage({ id, result: res }))
                  .catch(err => self.postMessage({ id, error: err.message }));
              } else {
                self.postMessage({ id, result });
              }
            } catch (error) {
              self.postMessage({ id, error: error.message });
            }
          };
        `], { type: 'application/javascript' });
        
        const blobURL = URL.createObjectURL(blob);
        worker = new Worker(blobURL);
        
        // Blob URL 정리
        worker.addEventListener('error', () => URL.revokeObjectURL(blobURL));
      } else {
        throw new Error('workerScript must be a URL string or function');
      }

      worker.onmessage = (event) => {
        const { id, result, error } = event.data;
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        setIsRunning(false);
        
        if (error) {
          setError(new Error(error));
          if (rejectRef.current) {
            rejectRef.current(new Error(error));
          }
        } else {
          setResult(result);
          setError(null);
          if (resolveRef.current) {
            resolveRef.current(result);
          }
        }
      };

      worker.onerror = (err) => {
        setError(err);
        setIsRunning(false);
        if (rejectRef.current) {
          rejectRef.current(err);
        }
      };

      workerRef.current = worker;
      setIsReady(true);
      setError(null);
      
    } catch (err) {
      setError(err);
      setIsReady(false);
    }
  }, [workerScript]);

  // 워커 종료
  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsReady(false);
    setIsRunning(false);
    setResult(null);
    setError(null);
  }, []);

  // 작업 실행
  const runTask = useCallback((data) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker not ready'));
        return;
      }

      if (isRunning) {
        reject(new Error('Worker is already running a task'));
        return;
      }

      setIsRunning(true);
      setError(null);
      resolveRef.current = resolve;
      rejectRef.current = reject;

      const taskId = Date.now() + Math.random();
      
      // 타임아웃 설정
      timeoutRef.current = setTimeout(() => {
        setIsRunning(false);
        setError(new Error('Worker task timeout'));
        reject(new Error('Worker task timeout'));
      }, timeout);

      // 워커에 작업 전송
      workerRef.current.postMessage({ id: taskId, data });
    });
  }, [isReady, isRunning, timeout]);

  // 컴포넌트 마운트 시 워커 초기화
  useEffect(() => {
    initializeWorker();
    
    return () => {
      if (autoTerminate) {
        terminateWorker();
      }
    };
  }, [initializeWorker, autoTerminate, terminateWorker]);

  return {
    isReady,
    isRunning,
    error,
    result,
    runTask,
    terminateWorker,
    reinitialize: initializeWorker
  };
};

/**
 * 계산 작업용 웹 워커 훅
 * 
 * @param {Function} calculationFunction - 계산 함수
 * @param {Object} options - 옵션
 * @returns {Object} 계산 워커 상태와 메서드
 */
export const useCalculationWorker = (calculationFunction, options = {}) => {
  const worker = useWorker(calculationFunction, options);
  
  const calculate = useCallback(async (data) => {
    try {
      const startTime = performance.now();
      const result = await worker.runTask(data);
      const endTime = performance.now();
      
      return {
        result,
        executionTime: endTime - startTime,
        success: true
      };
    } catch (error) {
      return {
        result: null,
        error,
        success: false
      };
    }
  }, [worker.runTask]);

  return {
    ...worker,
    calculate
  };
};

/**
 * 이미지 처리용 웹 워커 훅
 * 
 * @param {Object} options - 이미지 처리 옵션
 * @returns {Object} 이미지 처리 워커 상태와 메서드
 */
export const useImageWorker = (options = {}) => {
  const imageProcessor = useCallback((imageData) => {
    // 이미지 처리 로직 (리사이즈, 압축, 필터 등)
    return new Promise((resolve) => {
      const canvas = new OffscreenCanvas(imageData.width, imageData.height);
      const ctx = canvas.getContext('2d');
      
      // 이미지 처리 작업 수행
      const processedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      resolve(processedData);
    });
  }, []);

  const worker = useWorker(imageProcessor, options);

  const processImage = useCallback(async (imageFile, processOptions = {}) => {
    try {
      const imageData = await createImageBitmap(imageFile);
      return await worker.runTask({ imageData, options: processOptions });
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }, [worker.runTask]);

  return {
    ...worker,
    processImage
  };
};

/**
 * 데이터 처리용 웹 워커 풀 훅
 * 
 * @param {Function} processingFunction - 처리 함수
 * @param {Object} options - 워커 풀 옵션
 * @param {number} [options.poolSize=4] - 워커 풀 크기
 * @returns {Object} 워커 풀 상태와 메서드
 */
export const useWorkerPool = (processingFunction, options = {}) => {
  const { poolSize = navigator.hardwareConcurrency || 4 } = options;
  
  const [workers, setWorkers] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const taskQueue = useRef([]);

  // 워커 풀 초기화
  useEffect(() => {
    const newWorkers = Array.from({ length: poolSize }, () => 
      new Worker(
        new Blob([`
          self.onmessage = function(e) {
            const { id, data } = e.data;
            try {
              const fn = ${processingFunction.toString()};
              const result = fn(data);
              self.postMessage({ id, result });
            } catch (error) {
              self.postMessage({ id, error: error.message });
            }
          };
        `], { type: 'application/javascript' })
      )
    );

    setWorkers(newWorkers);
    setAvailableWorkers([...newWorkers]);

    return () => {
      newWorkers.forEach(worker => worker.terminate());
    };
  }, [processingFunction, poolSize]);

  // 작업 실행
  const executeTask = useCallback((data) => {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject, id: Date.now() + Math.random() };
      
      if (availableWorkers.length > 0) {
        const worker = availableWorkers.pop();
        setAvailableWorkers([...availableWorkers]);
        
        worker.onmessage = (event) => {
          const { result, error } = event.data;
          
          if (error) {
            reject(new Error(error));
          } else {
            resolve(result);
          }
          
          // 워커를 다시 사용 가능 상태로 변경
          setAvailableWorkers(prev => [...prev, worker]);
          
          // 대기 중인 작업이 있으면 실행
          if (taskQueue.current.length > 0) {
            const nextTask = taskQueue.current.shift();
            executeTask(nextTask.data)
              .then(nextTask.resolve)
              .catch(nextTask.reject);
          }
        };
        
        worker.postMessage({ id: task.id, data });
      } else {
        // 사용 가능한 워커가 없으면 큐에 추가
        taskQueue.current.push(task);
      }
    });
  }, [availableWorkers]);

  return {
    executeTask,
    availableWorkers: availableWorkers.length,
    queueLength: taskQueue.current.length,
    totalWorkers: poolSize
  };
};

export default useWorker;